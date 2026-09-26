import base64
import json
from datetime import datetime
from zoneinfo import ZoneInfo

import requests
import streamlit as st


# ============================================================
# CONFIGURAÇÕES
# ============================================================

st.set_page_config(
    page_title="Controle de Filas - Totem",
    page_icon="🚛",
    layout="centered"
)

TZ = ZoneInfo("America/Sao_Paulo")


# ============================================================
# SECRETS
# ============================================================

ADMIN_PASSWORD = st.secrets.get("ADMIN_PASSWORD", "")

GITHUB_TOKEN = st.secrets.get("GITHUB_TOKEN", "")
GITHUB_OWNER = st.secrets.get("GITHUB_OWNER", "")
GITHUB_REPO = st.secrets.get("GITHUB_REPO", "")
GITHUB_BRANCH = st.secrets.get("GITHUB_BRANCH", "main")

STATUS_FILE = "status.json"


# ============================================================
# CSS
# ============================================================

st.markdown(
    """
    <style>

    .block-container {
        max-width: 900px;
        padding-top: 2rem;
    }

    h1 {
        font-size: 44px !important;
    }

    .status-box {
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        margin-bottom: 15px;
        font-size: 22px;
        font-weight: bold;
    }

    .aberta {
        background: rgba(0, 180, 80, 0.15);
        border: 1px solid #00b450;
    }

    .fechada {
        background: rgba(255, 60, 60, 0.15);
        border: 1px solid #ff3c3c;
    }

    </style>
    """,
    unsafe_allow_html=True
)


# ============================================================
# VERIFICAÇÃO DE CONFIGURAÇÃO
# ============================================================

if not ADMIN_PASSWORD:
    st.error("ADMIN_PASSWORD não configurada nos Secrets.")
    st.stop()

if not GITHUB_TOKEN:
    st.error("GITHUB_TOKEN não configurado nos Secrets.")
    st.stop()

if not GITHUB_OWNER or not GITHUB_REPO:
    st.error("Configure GITHUB_OWNER e GITHUB_REPO nos Secrets.")
    st.stop()


# ============================================================
# CABEÇALHO GITHUB
# ============================================================

def github_headers():
    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


# ============================================================
# URL DA API
# ============================================================

def github_api_url():
    return (
        f"https://api.github.com/repos/"
        f"{GITHUB_OWNER}/{GITHUB_REPO}/contents/{STATUS_FILE}"
    )


# ============================================================
# STATUS PADRÃO
# ============================================================

def status_padrao():
    agora = datetime.now(TZ)

    return {
        "carga_aberta": True,
        "descarga_aberta": True,
        "data_referencia": agora.strftime("%Y-%m-%d"),
        "atualizado_em": agora.isoformat(),
        "atualizado_por": "SISTEMA",
    }


# ============================================================
# LER STATUS NO GITHUB
# ============================================================

def ler_status():

    try:

        resposta = requests.get(
            github_api_url(),
            headers=github_headers(),
            params={"ref": GITHUB_BRANCH},
            timeout=15,
        )

        # Arquivo ainda não existe
        if resposta.status_code == 404:

            dados = status_padrao()

            criar_status(dados)

            return dados

        resposta.raise_for_status()

        info = resposta.json()

        conteudo = base64.b64decode(
            info["content"]
        ).decode("utf-8")

        dados = json.loads(conteudo)

        return dados

    except requests.exceptions.RequestException as erro:

        st.error(
            "Não foi possível consultar o status no GitHub."
        )

        st.code(str(erro))

        st.stop()

    except Exception as erro:

        st.error(
            "Erro ao interpretar o arquivo status.json."
        )

        st.code(str(erro))

        st.stop()


# ============================================================
# CRIAR STATUS.JSON
# ============================================================

def criar_status(dados):

    conteudo = json.dumps(
        dados,
        ensure_ascii=False,
        indent=2
    )

    encoded = base64.b64encode(
        conteudo.encode("utf-8")
    ).decode("utf-8")

    payload = {
        "message": "Criar status inicial do totem",
        "content": encoded,
        "branch": GITHUB_BRANCH,
    }

    resposta = requests.put(
        github_api_url(),
        headers=github_headers(),
        json=payload,
        timeout=15,
    )

    if resposta.status_code not in (200, 201):

        st.error(
            "Não foi possível criar status.json no GitHub."
        )

        st.code(resposta.text)

        st.stop()


# ============================================================
# PEGAR SHA ATUAL
# ============================================================

def pegar_sha():

    resposta = requests.get(
        github_api_url(),
        headers=github_headers(),
        params={"ref": GITHUB_BRANCH},
        timeout=15,
    )

    if resposta.status_code == 404:
        return None

    resposta.raise_for_status()

    return resposta.json()["sha"]


# ============================================================
# SALVAR STATUS
# ============================================================

def salvar_status(
    carga_aberta,
    descarga_aberta,
    operador
):

    agora = datetime.now(TZ)

    dados = {
        "carga_aberta": carga_aberta,
        "descarga_aberta": descarga_aberta,
        "data_referencia": agora.strftime("%Y-%m-%d"),
        "atualizado_em": agora.isoformat(),
        "atualizado_por": operador or "PORTARIA",
    }

    conteudo = json.dumps(
        dados,
        ensure_ascii=False,
        indent=2
    )

    encoded = base64.b64encode(
        conteudo.encode("utf-8")
    ).decode("utf-8")

    try:

        sha = pegar_sha()

        payload = {
            "message": (
                "Atualizar status das filas do totem"
            ),
            "content": encoded,
            "branch": GITHUB_BRANCH,
        }

        if sha:
            payload["sha"] = sha

        resposta = requests.put(
            github_api_url(),
            headers=github_headers(),
            json=payload,
            timeout=15,
        )

        if resposta.status_code not in (200, 201):

            st.error(
                "GitHub recusou a atualização."
            )

            st.code(resposta.text)

            st.stop()

        return True

    except requests.exceptions.RequestException as erro:

        st.error(
            "Falha ao atualizar status no GitHub."
        )

        st.code(str(erro))

        st.stop()


# ============================================================
# RESET AUTOMÁTICO NO DIA SEGUINTE
# ============================================================

def verificar_novo_dia(status):

    hoje = datetime.now(TZ).strftime("%Y-%m-%d")

    data_status = status.get(
        "data_referencia",
        ""
    )

    if data_status != hoje:

        salvar_status(
            True,
            True,
            "ABERTURA AUTOMÁTICA"
        )

        return ler_status()

    return status


# ============================================================
# LOGIN
# ============================================================

if "autenticado" not in st.session_state:
    st.session_state.autenticado = False


if not st.session_state.autenticado:

    st.title("🔐 Controle de Filas do Totem")

    senha = st.text_input(
        "Senha administrativa",
        type="password"
    )

    if st.button(
        "Entrar",
        use_container_width=True
    ):

        if senha == ADMIN_PASSWORD:

            st.session_state.autenticado = True

            st.rerun()

        else:

            st.error("Senha incorreta.")

    st.stop()


# ============================================================
# PAINEL
# ============================================================

st.title("🚛 Controle de Filas - Totem")

st.caption(
    "Controle remoto das filas de carga e descarga."
)


operador = st.text_input(
    "Operador",
    value="PORTARIA"
)


status = ler_status()

status = verificar_novo_dia(status)


carga_aberta = bool(
    status.get("carga_aberta", True)
)

descarga_aberta = bool(
    status.get("descarga_aberta", True)
)


# ============================================================
# STATUS CARGA / DESCARGA
# ============================================================

col1, col2 = st.columns(2)


with col1:

    st.subheader("🚛 CARGA")

    if carga_aberta:

        st.markdown(
            """
            <div class="status-box aberta">
            🟢 FILA ABERTA
            </div>
            """,
            unsafe_allow_html=True
        )

        if st.button(
            "🔴 ENCERRAR CARGA",
            use_container_width=True
        ):

            salvar_status(
                False,
                descarga_aberta,
                operador
            )

            st.rerun()

    else:

        st.markdown(
            """
            <div class="status-box fechada">
            🔴 FILA ENCERRADA
            </div>
            """,
            unsafe_allow_html=True
        )

        if st.button(
            "🟢 REABRIR CARGA",
            use_container_width=True
        ):

            salvar_status(
                True,
                descarga_aberta,
                operador
            )

            st.rerun()


with col2:

    st.subheader("🛢️ DESCARGA")

    if descarga_aberta:

        st.markdown(
            """
            <div class="status-box aberta">
            🟢 FILA ABERTA
            </div>
            """,
            unsafe_allow_html=True
        )

        if st.button(
            "🔴 ENCERRAR DESCARGA",
            use_container_width=True
        ):

            salvar_status(
                carga_aberta,
                False,
                operador
            )

            st.rerun()

    else:

        st.markdown(
            """
            <div class="status-box fechada">
            🔴 FILA ENCERRADA
            </div>
            """,
            unsafe_allow_html=True
        )

        if st.button(
            "🟢 REABRIR DESCARGA",
            use_container_width=True
        ):

            salvar_status(
                carga_aberta,
                True,
                operador
            )

            st.rerun()


# ============================================================
# AÇÕES GERAIS
# ============================================================

st.divider()

col3, col4 = st.columns(2)


with col3:

    if st.button(
        "⛔ ENCERRAR AMBAS",
        type="primary",
        use_container_width=True
    ):

        salvar_status(
            False,
            False,
            operador
        )

        st.rerun()


with col4:

    if st.button(
        "✅ REABRIR AMBAS",
        use_container_width=True
    ):

        salvar_status(
            True,
            True,
            operador
        )

        st.rerun()


# ============================================================
# INFORMAÇÕES
# ============================================================

st.divider()

st.subheader("📋 Informações")

ultima = status.get(
    "atualizado_em",
    "-"
)

usuario = status.get(
    "atualizado_por",
    "-"
)

data_ref = status.get(
    "data_referencia",
    "-"
)


st.write(
    f"**Última alteração:** {ultima}"
)

st.write(
    f"**Operador:** {usuario}"
)

st.write(
    f"**Data:** {data_ref}"
)


# ============================================================
# ATUALIZAR
# ============================================================

st.divider()

if st.button(
    "🔄 Atualizar status",
    use_container_width=True
):

    st.rerun()


# ============================================================
# LOGOUT
# ============================================================

if st.button(
    "🚪 Sair do painel",
    use_container_width=True
):

    st.session_state.autenticado = False

    st.rerun()
