import base64
import json
import time
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
    layout="centered",
)

TZ = ZoneInfo("America/Sao_Paulo")
STATUS_FILE = "status.json"

ADMIN_PASSWORD = st.secrets.get("ADMIN_PASSWORD", "")
GITHUB_TOKEN = st.secrets.get("GITHUB_TOKEN", "")
GITHUB_OWNER = st.secrets.get("GITHUB_OWNER", "TS-Tec-Dev")
GITHUB_REPO = st.secrets.get("GITHUB_REPO", "stangfila")
GITHUB_BRANCH = st.secrets.get("GITHUB_BRANCH", "main")


# ============================================================
# VISUAL
# ============================================================

st.markdown(
    """
    <style>
      .block-container {max-width: 900px; padding-top: 2rem;}
      h1 {font-size: 44px !important;}
      .status-box {
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        margin-bottom: 14px;
        font-size: 22px;
        font-weight: 800;
      }
      .aberta {
        background: rgba(0, 180, 80, 0.15);
        border: 1px solid #00b450;
      }
      .fechada {
        background: rgba(255, 60, 60, 0.15);
        border: 1px solid #ff3c3c;
      }
      .small-note {opacity: .75; font-size: 13px;}
    </style>
    """,
    unsafe_allow_html=True,
)


# ============================================================
# VALIDAÇÃO DOS SECRETS
# ============================================================

faltando = []
if not ADMIN_PASSWORD:
    faltando.append("ADMIN_PASSWORD")
if not GITHUB_TOKEN:
    faltando.append("GITHUB_TOKEN")
if not GITHUB_OWNER:
    faltando.append("GITHUB_OWNER")
if not GITHUB_REPO:
    faltando.append("GITHUB_REPO")

if faltando:
    st.error("Secrets ausentes: " + ", ".join(faltando))
    st.stop()


# ============================================================
# GITHUB API
# ============================================================

def github_headers():
    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def github_api_url():
    return (
        f"https://api.github.com/repos/"
        f"{GITHUB_OWNER}/{GITHUB_REPO}/contents/{STATUS_FILE}"
    )


def status_padrao():
    agora = datetime.now(TZ)
    return {
        "carga_aberta": True,
        "descarga_aberta": True,
        "data_referencia": agora.strftime("%Y-%m-%d"),
        "atualizado_em": agora.isoformat(),
        "atualizado_por": "SISTEMA",
    }


def _decodificar_status(info):
    conteudo = base64.b64decode(info["content"]).decode("utf-8")
    dados = json.loads(conteudo)

    if not isinstance(dados.get("carga_aberta"), bool):
        raise ValueError("carga_aberta não é booleano")
    if not isinstance(dados.get("descarga_aberta"), bool):
        raise ValueError("descarga_aberta não é booleano")

    return dados


def ler_status():
    try:
        resposta = requests.get(
            github_api_url(),
            headers=github_headers(),
            params={"ref": GITHUB_BRANCH, "_": str(time.time_ns())},
            timeout=20,
        )

        if resposta.status_code == 404:
            dados = status_padrao()
            criar_status(dados)
            return dados

        resposta.raise_for_status()
        return _decodificar_status(resposta.json())

    except requests.exceptions.RequestException as erro:
        st.error("Não foi possível consultar o status no GitHub.")
        st.code(str(erro))
        st.stop()
    except Exception as erro:
        st.error("Erro ao interpretar status.json.")
        st.code(str(erro))
        st.stop()


def criar_status(dados):
    conteudo = json.dumps(dados, ensure_ascii=False, indent=2)
    encoded = base64.b64encode(conteudo.encode("utf-8")).decode("utf-8")

    payload = {
        "message": "Criar status inicial do totem",
        "content": encoded,
        "branch": GITHUB_BRANCH,
    }

    resposta = requests.put(
        github_api_url(),
        headers=github_headers(),
        json=payload,
        timeout=20,
    )

    if resposta.status_code not in (200, 201):
        st.error("Não foi possível criar status.json no GitHub.")
        st.code(resposta.text)
        st.stop()


def pegar_sha():
    resposta = requests.get(
        github_api_url(),
        headers=github_headers(),
        params={"ref": GITHUB_BRANCH, "_": str(time.time_ns())},
        timeout=20,
    )

    if resposta.status_code == 404:
        return None

    resposta.raise_for_status()
    return resposta.json()["sha"]


def salvar_status(carga_aberta, descarga_aberta, operador):
    agora = datetime.now(TZ)

    dados = {
        "carga_aberta": bool(carga_aberta),
        "descarga_aberta": bool(descarga_aberta),
        "data_referencia": agora.strftime("%Y-%m-%d"),
        "atualizado_em": agora.isoformat(),
        "atualizado_por": (operador or "PORTARIA").strip() or "PORTARIA",
    }

    conteudo = json.dumps(dados, ensure_ascii=False, indent=2)
    encoded = base64.b64encode(conteudo.encode("utf-8")).decode("utf-8")

    # Pequeno retry para evitar conflito de SHA caso dois cliques ocorram muito próximos.
    for tentativa in range(2):
        try:
            sha = pegar_sha()
            payload = {
                "message": "Atualizar status das filas do totem",
                "content": encoded,
                "branch": GITHUB_BRANCH,
            }
            if sha:
                payload["sha"] = sha

            resposta = requests.put(
                github_api_url(),
                headers=github_headers(),
                json=payload,
                timeout=20,
            )

            if resposta.status_code in (200, 201):
                return True

            if resposta.status_code == 409 and tentativa == 0:
                time.sleep(0.4)
                continue

            st.error("GitHub recusou a atualização.")
            st.code(resposta.text)
            st.stop()

        except requests.exceptions.RequestException as erro:
            if tentativa == 0:
                time.sleep(0.4)
                continue
            st.error("Falha ao atualizar status no GitHub.")
            st.code(str(erro))
            st.stop()

    return False


def verificar_novo_dia(status):
    hoje = datetime.now(TZ).strftime("%Y-%m-%d")
    if status.get("data_referencia") != hoje:
        salvar_status(True, True, "ABERTURA AUTOMÁTICA")
        return ler_status()
    return status


# ============================================================
# LOGIN
# ============================================================

if "autenticado" not in st.session_state:
    st.session_state.autenticado = False

if not st.session_state.autenticado:
    st.title("🔐 Controle de Filas do Totem")
    senha = st.text_input("Senha administrativa", type="password")

    if st.button("Entrar", use_container_width=True):
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
st.caption("Controle remoto das filas de carga e descarga.")

operador = st.text_input("Operador", value="PORTARIA")

status = verificar_novo_dia(ler_status())
carga_aberta = bool(status.get("carga_aberta", True))
descarga_aberta = bool(status.get("descarga_aberta", True))

col1, col2 = st.columns(2)

with col1:
    st.subheader("🚛 CARGA")
    classe = "aberta" if carga_aberta else "fechada"
    rotulo = "🟢 FILA ABERTA" if carga_aberta else "🔴 FILA ENCERRADA"
    st.markdown(
        f'<div class="status-box {classe}">{rotulo}</div>',
        unsafe_allow_html=True,
    )

    if carga_aberta:
        if st.button("🔴 ENCERRAR CARGA", use_container_width=True):
            salvar_status(False, descarga_aberta, operador)
            st.rerun()
    else:
        if st.button("🟢 REABRIR CARGA", use_container_width=True):
            salvar_status(True, descarga_aberta, operador)
            st.rerun()

with col2:
    st.subheader("🛢️ DESCARGA")
    classe = "aberta" if descarga_aberta else "fechada"
    rotulo = "🟢 FILA ABERTA" if descarga_aberta else "🔴 FILA ENCERRADA"
    st.markdown(
        f'<div class="status-box {classe}">{rotulo}</div>',
        unsafe_allow_html=True,
    )

    if descarga_aberta:
        if st.button("🔴 ENCERRAR DESCARGA", use_container_width=True):
            salvar_status(carga_aberta, False, operador)
            st.rerun()
    else:
        if st.button("🟢 REABRIR DESCARGA", use_container_width=True):
            salvar_status(carga_aberta, True, operador)
            st.rerun()

st.divider()
col3, col4 = st.columns(2)

with col3:
    if st.button("⛔ ENCERRAR AMBAS", type="primary", use_container_width=True):
        salvar_status(False, False, operador)
        st.rerun()

with col4:
    if st.button("✅ REABRIR AMBAS", use_container_width=True):
        salvar_status(True, True, operador)
        st.rerun()

st.divider()
st.subheader("📋 Informações")
st.write(f"**Última alteração:** {status.get('atualizado_em', '-')}")
st.write(f"**Operador:** {status.get('atualizado_por', '-')}")
st.write(f"**Data:** {status.get('data_referencia', '-')}")
st.markdown(
    '<div class="small-note">O totem consulta o GitHub periodicamente. Alterações normalmente aparecem em poucos segundos.</div>',
    unsafe_allow_html=True,
)

st.divider()

if st.button("🔄 Atualizar status", use_container_width=True):
    st.rerun()

if st.button("🚪 Sair do painel", use_container_width=True):
    st.session_state.autenticado = False
    st.rerun()
