import base64
import html
import json
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
import streamlit as st
import streamlit.components.v1 as components

# ============================================================
# CONFIGURAÇÕES
# ============================================================

st.set_page_config(
    page_title="Controle de Filas - Totem",
    page_icon="🚛",
    layout="wide",
)

TZ = ZoneInfo("America/Sao_Paulo")
STATUS_FILE = "status.json"
FUNCIONARIOS_FILE = "funcionarios.json"
HISTORICO_FILE = "historico.json"
LOGO_FILE = Path("logo.png")

GITHUB_TOKEN = st.secrets.get("GITHUB_TOKEN", "")
GITHUB_OWNER = st.secrets.get("GITHUB_OWNER", "TS-Tec-Dev")
GITHUB_REPO = st.secrets.get("GITHUB_REPO", "stangfila")
GITHUB_BRANCH = st.secrets.get("GITHUB_BRANCH", "main")

# ============================================================
# VISUAL - CINZA CHUMBO + BRANCO
# ============================================================

st.markdown(
    """
    <style>
      :root {
        --chumbo: #202428;
        --chumbo-2: #2a2f34;
        --chumbo-3: #343a40;
        --branco: #ffffff;
        --cinza: #c9ced4;
        --linha: #4a5158;
        --verde: #29c76f;
        --vermelho: #ff4d5a;
      }

      .stApp { background: var(--chumbo); color: var(--branco); }
      .block-container { max-width: 1120px; padding-top: 1.4rem; padding-bottom: 3rem; }
      h1, h2, h3, p, label, div { color: var(--branco); }

      div[data-testid="stTabs"] button {
        color: var(--branco) !important;
        font-weight: 800 !important;
      }

      div[data-testid="stTextInput"] input,
      div[data-testid="stSelectbox"] > div > div,
      div[data-testid="stMultiSelect"] > div > div {
        background: var(--chumbo-2) !important;
        color: var(--branco) !important;
        border-color: var(--linha) !important;
      }

      div[data-testid="stButton"] button {
        background: var(--chumbo-2);
        color: var(--branco);
        border: 1px solid var(--linha);
        border-radius: 10px;
        font-weight: 800;
      }
      div[data-testid="stButton"] button:hover {
        border-color: #ffffff;
        color: #ffffff;
      }

      .topo {
        display: flex;
        align-items: center;
        gap: 22px;
        margin-bottom: 10px;
      }
      .titulo-principal {
        font-size: 38px;
        font-weight: 900;
        line-height: 1.05;
        color: #ffffff;
      }
      .subtitulo {
        color: #c9ced4;
        margin-top: 8px;
        font-size: 15px;
      }

      .status-box {
        padding: 24px 18px;
        border-radius: 14px;
        text-align: center;
        margin-bottom: 12px;
        font-size: 22px;
        font-weight: 900;
        background: var(--chumbo-2);
      }
      .aberta {
        border: 1px solid var(--verde);
        box-shadow: inset 0 0 0 1px rgba(41,199,111,.08);
      }
      .fechada {
        border: 1px solid var(--vermelho);
        box-shadow: inset 0 0 0 1px rgba(255,77,90,.08);
      }

      .aviso-preview {
        background: linear-gradient(160deg,#d32f2f 0%,#8b0000 100%);
        border: 3px solid #ff5252;
        border-radius: 18px;
        padding: 26px 24px;
        text-align: center;
        max-width: 430px;
        margin: 0 auto 18px auto;
        box-shadow: 0 12px 35px rgba(0,0,0,.42);
      }
      .aviso-icone { font-size: 46px; line-height: 1; margin-bottom: 10px; }
      .aviso-titulo { font-size: 21px; font-weight: 900; margin-bottom: 14px; }
      .aviso-fila { font-size: 25px; font-weight: 900; color: #ffeb3b; line-height: 1.2; margin-bottom: 16px; }
      .aviso-data { font-size: 19px; font-weight: 800; margin-bottom: 14px; }
      .aviso-msg { font-size: 15px; line-height: 1.45; }
      .aviso-rodape { width: 86%; margin: 18px auto 0 auto; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.45); font-size: 14px; font-weight: 900; }

      .card-chumbo {
        background: var(--chumbo-2);
        border: 1px solid var(--linha);
        border-radius: 14px;
        padding: 18px;
        margin-bottom: 16px;
      }
      .small-note { color: #b8bec5; font-size: 13px; }
    </style>
    """,
    unsafe_allow_html=True,
)

# ============================================================
# VALIDAÇÃO DOS SECRETS
# ============================================================

if not GITHUB_TOKEN:
    st.error("GITHUB_TOKEN não configurado nos Secrets do Streamlit.")
    st.stop()

# ============================================================
# GITHUB API - FUNÇÕES GENÉRICAS
# ============================================================


def github_headers():
    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def github_file_url(caminho):
    return (
        f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}"
        f"/contents/{caminho}"
    )


def ler_json(caminho, padrao=None, criar_se_faltar=False):
    try:
        resposta = requests.get(
            github_file_url(caminho),
            headers=github_headers(),
            params={"ref": GITHUB_BRANCH, "_": str(time.time_ns())},
            timeout=20,
        )

        if resposta.status_code == 404:
            dados = padrao() if callable(padrao) else padrao
            if dados is None:
                return None
            if criar_se_faltar:
                salvar_json(caminho, dados, f"Criar {caminho}")
            return dados

        resposta.raise_for_status()
        info = resposta.json()
        conteudo = base64.b64decode(info["content"]).decode("utf-8")
        return json.loads(conteudo)

    except requests.exceptions.RequestException as erro:
        st.error(f"Não foi possível consultar {caminho} no GitHub.")
        st.code(str(erro))
        st.stop()
    except Exception as erro:
        st.error(f"Erro ao interpretar {caminho}.")
        st.code(str(erro))
        st.stop()


def pegar_sha(caminho):
    resposta = requests.get(
        github_file_url(caminho),
        headers=github_headers(),
        params={"ref": GITHUB_BRANCH, "_": str(time.time_ns())},
        timeout=20,
    )
    if resposta.status_code == 404:
        return None
    resposta.raise_for_status()
    return resposta.json()["sha"]


def salvar_json(caminho, dados, mensagem):
    conteudo = json.dumps(dados, ensure_ascii=False, indent=2)
    encoded = base64.b64encode(conteudo.encode("utf-8")).decode("utf-8")

    for tentativa in range(3):
        try:
            sha = pegar_sha(caminho)
            payload = {
                "message": mensagem,
                "content": encoded,
                "branch": GITHUB_BRANCH,
            }
            if sha:
                payload["sha"] = sha

            resposta = requests.put(
                github_file_url(caminho),
                headers=github_headers(),
                json=payload,
                timeout=20,
            )

            if resposta.status_code in (200, 201):
                return True

            if resposta.status_code == 409 and tentativa < 2:
                time.sleep(0.5)
                continue

            st.error(f"GitHub recusou a atualização de {caminho}.")
            st.code(resposta.text)
            st.stop()

        except requests.exceptions.RequestException as erro:
            if tentativa < 2:
                time.sleep(0.5)
                continue
            st.error(f"Falha ao atualizar {caminho} no GitHub.")
            st.code(str(erro))
            st.stop()

    return False

# ============================================================
# DADOS PADRÃO
# ============================================================


def agora_sp():
    return datetime.now(TZ)


def status_padrao():
    agora = agora_sp()
    return {
        "carga_aberta": True,
        "descarga_aberta": True,
        "data_referencia": agora.strftime("%Y-%m-%d"),
        "atualizado_em": agora.isoformat(),
        "atualizado_por": "SISTEMA",
        "carga_encerrada_por": None,
        "carga_encerrada_em": None,
        "descarga_encerrada_por": None,
        "descarga_encerrada_em": None,
    }


def funcionarios_padrao():
    return ["PORTARIA"]


def historico_padrao():
    return []


def normalizar_status(status):
    base = status_padrao()
    if isinstance(status, dict):
        base.update(status)
    base["carga_aberta"] = bool(base.get("carga_aberta", True))
    base["descarga_aberta"] = bool(base.get("descarga_aberta", True))
    return base


def ler_status():
    return normalizar_status(
        ler_json(STATUS_FILE, status_padrao, criar_se_faltar=True)
    )


def ler_funcionarios():
    dados = ler_json(FUNCIONARIOS_FILE, funcionarios_padrao, criar_se_faltar=True)
    if not isinstance(dados, list):
        dados = funcionarios_padrao()
    limpos = []
    vistos = set()
    for item in dados:
        nome = str(item).strip()
        chave = nome.casefold()
        if nome and chave not in vistos:
            vistos.add(chave)
            limpos.append(nome)
    return sorted(limpos, key=str.casefold)


def ler_historico():
    dados = ler_json(HISTORICO_FILE, historico_padrao, criar_se_faltar=True)
    return dados if isinstance(dados, list) else []

# ============================================================
# HISTÓRICO
# ============================================================


def registrar_historico(funcionario, acao, status_depois, observacao=""):
    historico = ler_historico()
    agora = agora_sp()
    historico.append(
        {
            "data_hora": agora.isoformat(),
            "data": agora.strftime("%d/%m/%Y"),
            "hora": agora.strftime("%H:%M:%S"),
            "funcionario": funcionario,
            "acao": acao,
            "carga": "ABERTA" if status_depois["carga_aberta"] else "ENCERRADA",
            "descarga": "ABERTA" if status_depois["descarga_aberta"] else "ENCERRADA",
            "observacao": observacao,
        }
    )

    # Mantém os últimos 5.000 registros para evitar crescimento ilimitado.
    historico = historico[-5000:]
    salvar_json(HISTORICO_FILE, historico, f"Registrar histórico: {acao}")

# ============================================================
# ALTERAÇÃO DE STATUS
# ============================================================


def atualizar_status(status_atual, carga_aberta, descarga_aberta, funcionario, acao):
    agora = agora_sp()
    novo = normalizar_status(status_atual)
    novo["carga_aberta"] = bool(carga_aberta)
    novo["descarga_aberta"] = bool(descarga_aberta)
    novo["data_referencia"] = agora.strftime("%Y-%m-%d")
    novo["atualizado_em"] = agora.isoformat()
    novo["atualizado_por"] = funcionario

    if status_atual.get("carga_aberta", True) and not carga_aberta:
        novo["carga_encerrada_por"] = funcionario
        novo["carga_encerrada_em"] = agora.isoformat()
    elif carga_aberta:
        novo["carga_encerrada_por"] = None
        novo["carga_encerrada_em"] = None

    if status_atual.get("descarga_aberta", True) and not descarga_aberta:
        novo["descarga_encerrada_por"] = funcionario
        novo["descarga_encerrada_em"] = agora.isoformat()
    elif descarga_aberta:
        novo["descarga_encerrada_por"] = None
        novo["descarga_encerrada_em"] = None

    salvar_json(STATUS_FILE, novo, f"Atualizar filas: {acao}")
    registrar_historico(funcionario, acao, novo)
    return novo


def verificar_novo_dia(status):
    hoje = agora_sp().strftime("%Y-%m-%d")
    if status.get("data_referencia") == hoje:
        return status

    agora = agora_sp()
    novo = normalizar_status(status)
    novo.update(
        {
            "carga_aberta": True,
            "descarga_aberta": True,
            "data_referencia": hoje,
            "atualizado_em": agora.isoformat(),
            "atualizado_por": "SISTEMA",
            "carga_encerrada_por": None,
            "carga_encerrada_em": None,
            "descarga_encerrada_por": None,
            "descarga_encerrada_em": None,
        }
    )
    salvar_json(STATUS_FILE, novo, "Abertura automática das filas no novo dia")
    registrar_historico("SISTEMA", "ABERTURA AUTOMÁTICA DO DIA", novo)
    return novo

# ============================================================
# AVISO / WHATSAPP
# ============================================================


def formatar_data_br(data_iso):
    if not data_iso:
        return ""
    try:
        return datetime.strptime(data_iso, "%Y-%m-%d").strftime("%d/%m/%Y")
    except Exception:
        return str(data_iso)


def formatar_data_hora_br(valor):
    if not valor:
        return "-"
    try:
        dt = datetime.fromisoformat(valor)
        return dt.astimezone(TZ).strftime("%d/%m/%Y %H:%M")
    except Exception:
        return str(valor)


def construir_aviso(status):
    carga = bool(status.get("carga_aberta", True))
    descarga = bool(status.get("descarga_aberta", True))
    data = formatar_data_br(status.get("data_referencia"))

    if carga and descarga:
        return None

    if not carga and not descarga:
        titulo = "ATENDIMENTO ENCERRADO"
        fila = "FILAS DE CARGA E DESCARGA ENCERRADAS"
        mensagem = "Não serão aceitas novas entradas para carga ou descarga no dia de hoje."
    elif not carga:
        titulo = "ATENÇÃO"
        fila = "FILA DE CARGA ENCERRADA"
        mensagem = "Não serão aceitas novas entradas para carga no dia de hoje."
    else:
        titulo = "ATENÇÃO"
        fila = "FILA DE DESCARGA ENCERRADA"
        mensagem = "Não serão aceitas novas entradas para descarga no dia de hoje."

    responsaveis = []
    if not carga:
        responsaveis.append(
            f"Carga: {status.get('carga_encerrada_por') or status.get('atualizado_por') or '-'}"
        )
    if not descarga:
        responsaveis.append(
            f"Descarga: {status.get('descarga_encerrada_por') or status.get('atualizado_por') or '-'}"
        )

    if len(responsaveis) == 2 and responsaveis[0].split(": ", 1)[1] == responsaveis[1].split(": ", 1)[1]:
        responsavel_texto = f"Responsável: {responsaveis[0].split(': ', 1)[1]}"
    else:
        responsavel_texto = " | ".join(responsaveis)

    whatsapp = (
        f"⛔ *{titulo}*\n"
        f"*{fila}*\n\n"
        f"📅 {data}\n"
        f"👤 {responsavel_texto}\n\n"
        f"{mensagem}\n\n"
        f"Para mais informações, procure a Portaria."
    )

    return {
        "titulo": titulo,
        "fila": fila,
        "mensagem": mensagem,
        "data": data,
        "responsavel": responsavel_texto,
        "whatsapp": whatsapp,
    }


def renderizar_aviso_preview(aviso):
    if not aviso:
        st.markdown(
            '<div class="card-chumbo"><b>Nenhum aviso ativo.</b><br><span class="small-note">Carga e Descarga estão abertas.</span></div>',
            unsafe_allow_html=True,
        )
        return

    st.markdown(
        f"""
        <div class="aviso-preview">
          <div class="aviso-icone">⛔</div>
          <div class="aviso-titulo">{html.escape(aviso['titulo'])}</div>
          <div class="aviso-fila">{html.escape(aviso['fila'])}</div>
          <div class="aviso-data">{html.escape(aviso['data'])}</div>
          <div class="aviso-msg">{html.escape(aviso['mensagem'])}</div>
          <div class="aviso-rodape">PROCURE A PORTARIA<br>PARA MAIS INFORMAÇÕES</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def botao_copiar(texto):
    texto_js = json.dumps(texto)
    components.html(
        f"""
        <div style="font-family:Arial,sans-serif;background:#202428;padding:0;margin:0;">
          <button id="copiar" style="width:100%;padding:12px 16px;border-radius:10px;border:1px solid #697078;background:#2a2f34;color:white;font-weight:800;cursor:pointer;">
            📋 Copiar aviso para WhatsApp
          </button>
          <div id="msg" style="color:#c9ced4;font-size:12px;margin-top:7px;text-align:center;"></div>
        </div>
        <script>
          const texto = {texto_js};
          const botao = document.getElementById('copiar');
          const msg = document.getElementById('msg');
          botao.addEventListener('click', async () => {{
            try {{
              await navigator.clipboard.writeText(texto);
              msg.textContent = 'Aviso copiado.';
            }} catch (e) {{
              const ta = document.createElement('textarea');
              ta.value = texto;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              ta.remove();
              msg.textContent = 'Aviso copiado.';
            }}
          }});
        </script>
        """,
        height=68,
    )

# ============================================================
# CABEÇALHO COM LOGO.PNG
# ============================================================

col_logo, col_titulo = st.columns([1, 6], vertical_alignment="center")
with col_logo:
    if LOGO_FILE.exists():
        st.image(str(LOGO_FILE), width=125)
with col_titulo:
    st.markdown(
        '<div class="titulo-principal">Controle de Filas - Totem</div>'
        '<div class="subtitulo">Controle remoto das filas de carga e descarga.</div>',
        unsafe_allow_html=True,
    )

if not LOGO_FILE.exists():
    st.caption("Adicione o arquivo logo.png na raiz do repositório para exibir o logotipo.")

# ============================================================
# CARREGA DADOS
# ============================================================

status = verificar_novo_dia(ler_status())
funcionarios = ler_funcionarios()

aba_controle, aba_funcionarios, aba_historico = st.tabs(
    ["🚛 Controle de Filas", "👥 Funcionários", "🧾 Histórico"]
)

# ============================================================
# ABA CONTROLE
# ============================================================

with aba_controle:
    st.subheader("Controle de Filas")

    if funcionarios:
        funcionario = st.selectbox(
            "Funcionário responsável pela alteração",
            funcionarios,
            key="funcionario_responsavel",
        )
    else:
        funcionario = None
        st.warning("Cadastre pelo menos um funcionário na aba Funcionários antes de alterar as filas.")

    carga_aberta = bool(status.get("carga_aberta", True))
    descarga_aberta = bool(status.get("descarga_aberta", True))

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("🚛 CARGA")
        classe = "aberta" if carga_aberta else "fechada"
        rotulo = "🟢 FILA ABERTA" if carga_aberta else "🔴 FILA ENCERRADA"
        st.markdown(f'<div class="status-box {classe}">{rotulo}</div>', unsafe_allow_html=True)

        if carga_aberta:
            if st.button("🔴 ENCERRAR CARGA", use_container_width=True, disabled=not funcionario):
                atualizar_status(status, False, descarga_aberta, funcionario, "ENCERROU CARGA")
                st.rerun()
        else:
            if st.button("🟢 REABRIR CARGA", use_container_width=True, disabled=not funcionario):
                atualizar_status(status, True, descarga_aberta, funcionario, "REABRIU CARGA")
                st.rerun()

    with col2:
        st.subheader("🛢️ DESCARGA")
        classe = "aberta" if descarga_aberta else "fechada"
        rotulo = "🟢 FILA ABERTA" if descarga_aberta else "🔴 FILA ENCERRADA"
        st.markdown(f'<div class="status-box {classe}">{rotulo}</div>', unsafe_allow_html=True)

        if descarga_aberta:
            if st.button("🔴 ENCERRAR DESCARGA", use_container_width=True, disabled=not funcionario):
                atualizar_status(status, carga_aberta, False, funcionario, "ENCERROU DESCARGA")
                st.rerun()
        else:
            if st.button("🟢 REABRIR DESCARGA", use_container_width=True, disabled=not funcionario):
                atualizar_status(status, carga_aberta, True, funcionario, "REABRIU DESCARGA")
                st.rerun()

    st.divider()
    c1, c2 = st.columns(2)
    with c1:
        if st.button("⛔ ENCERRAR AMBAS", use_container_width=True, disabled=not funcionario):
            atualizar_status(status, False, False, funcionario, "ENCERROU CARGA E DESCARGA")
            st.rerun()
    with c2:
        if st.button("✅ REABRIR AMBAS", use_container_width=True, disabled=not funcionario):
            atualizar_status(status, True, True, funcionario, "REABRIU CARGA E DESCARGA")
            st.rerun()

    st.divider()
    st.subheader("📢 Aviso ativo")
    aviso = construir_aviso(status)
    renderizar_aviso_preview(aviso)

    if aviso:
        st.markdown("**Texto para o grupo do WhatsApp:**")
        st.code(aviso["whatsapp"], language=None, wrap_lines=True)
        botao_copiar(aviso["whatsapp"])

    st.divider()
    st.subheader("📋 Informações atuais")
    info1, info2, info3 = st.columns(3)
    info1.metric("Última alteração", formatar_data_hora_br(status.get("atualizado_em")))
    info2.metric("Responsável", status.get("atualizado_por", "-"))
    info3.metric("Data", formatar_data_br(status.get("data_referencia")))

    if st.button("🔄 Atualizar status", use_container_width=True):
        st.rerun()

# ============================================================
# ABA FUNCIONÁRIOS
# ============================================================

with aba_funcionarios:
    st.subheader("Cadastro de Funcionários")
    st.caption("Os nomes cadastrados aparecem no seletor da aba Controle de Filas.")

    novo_nome = st.text_input("Nome do funcionário", placeholder="Ex.: João da Silva")
    if st.button("➕ Cadastrar funcionário", use_container_width=True):
        nome = novo_nome.strip()
        if not nome:
            st.warning("Informe o nome do funcionário.")
        elif any(nome.casefold() == existente.casefold() for existente in funcionarios):
            st.warning("Este funcionário já está cadastrado.")
        else:
            funcionarios_novos = sorted(funcionarios + [nome], key=str.casefold)
            salvar_json(FUNCIONARIOS_FILE, funcionarios_novos, f"Cadastrar funcionário: {nome}")
            st.success(f"Funcionário cadastrado: {nome}")
            st.rerun()

    st.divider()
    if funcionarios:
        remover = st.selectbox("Funcionário para remover", ["-- selecione --"] + funcionarios)
        if st.button("🗑️ Remover funcionário", use_container_width=True):
            if remover == "-- selecione --":
                st.warning("Selecione um funcionário.")
            else:
                funcionarios_novos = [n for n in funcionarios if n != remover]
                salvar_json(FUNCIONARIOS_FILE, funcionarios_novos, f"Remover funcionário: {remover}")
                st.success(f"Funcionário removido: {remover}")
                st.rerun()

        st.markdown("#### Funcionários cadastrados")
        for nome in funcionarios:
            st.markdown(f"- {html.escape(nome)}")
    else:
        st.info("Nenhum funcionário cadastrado.")

# ============================================================
# ABA HISTÓRICO
# ============================================================

with aba_historico:
    st.subheader("Histórico de Alterações")
    historico = ler_historico()

    if not historico:
        st.info("Ainda não há registros no histórico.")
    else:
        funcionarios_hist = sorted(
            {str(r.get("funcionario", "-")) for r in historico},
            key=str.casefold,
        )
        filtro_func = st.selectbox(
            "Filtrar por funcionário",
            ["Todos"] + funcionarios_hist,
            key="filtro_historico_funcionario",
        )

        registros = list(reversed(historico))
        if filtro_func != "Todos":
            registros = [r for r in registros if str(r.get("funcionario")) == filtro_func]

        linhas = []
        for r in registros:
            linhas.append(
                {
                    "Data": r.get("data", "-"),
                    "Hora": r.get("hora", "-"),
                    "Funcionário": r.get("funcionario", "-"),
                    "Ação": r.get("acao", "-"),
                    "Carga": r.get("carga", "-"),
                    "Descarga": r.get("descarga", "-"),
                }
            )

        st.dataframe(linhas, use_container_width=True, hide_index=True)
        st.caption(f"Exibindo {len(linhas)} registro(s).")

        # CSV simples para arquivamento local.
        cabecalho = "Data;Hora;Funcionário;Ação;Carga;Descarga\n"
        corpo = "\n".join(
            ";".join(str(l.get(c, "")).replace(";", ",") for c in ["Data", "Hora", "Funcionário", "Ação", "Carga", "Descarga"])
            for l in linhas
        )
        st.download_button(
            "⬇️ Baixar histórico em CSV",
            data=(cabecalho + corpo).encode("utf-8-sig"),
            file_name=f"historico_filas_{agora_sp().strftime('%Y%m%d_%H%M')}.csv",
            mime="text/csv",
            use_container_width=True,
        )

st.markdown(
    '<div class="small-note" style="margin-top:22px;">O totem consulta o GitHub periodicamente. As alterações normalmente aparecem em poucos segundos.</div>',
    unsafe_allow_html=True,
)
