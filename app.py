import os
from datetime import datetime
from zoneinfo import ZoneInfo

import requests
import streamlit as st

TZ = ZoneInfo("America/Sao_Paulo")

st.set_page_config(
    page_title="Controle de Filas - Totem",
    page_icon="🚛",
    layout="centered"
)

SUPABASE_URL = st.secrets.get(
    "SUPABASE_URL",
    os.getenv("SUPABASE_URL", "")
).rstrip("/")

SUPABASE_SERVICE_KEY = st.secrets.get(
    "SUPABASE_SERVICE_KEY",
    os.getenv("SUPABASE_SERVICE_KEY", "")
)

ADMIN_PASSWORD = st.secrets.get(
    "ADMIN_PASSWORD",
    os.getenv("ADMIN_PASSWORD", "")
)

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    st.error("Configure SUPABASE_URL e SUPABASE_SERVICE_KEY nos Secrets.")
    st.stop()


def headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def login():
    if st.session_state.get("auth"):
        return True

    st.title("🔐 Controle de Filas do Totem")

    pwd = st.text_input(
        "Senha administrativa",
        type="password"
    )

    if st.button("Entrar", use_container_width=True):
        if ADMIN_PASSWORD and pwd == ADMIN_PASSWORD:
            st.session_state.auth = True
            st.rerun()
        else:
            st.error("Senha inválida.")

    return False


def get_status():
    url = f"{SUPABASE_URL}/rest/v1/totem_status"

    try:
        response = requests.get(
            url,
            headers=headers(),
            params={
                "id": "eq.1",
                "select": "*"
            },
            timeout=15,
        )

        response.raise_for_status()

        dados = response.json()

        if not dados:
            return None

        return dados[0]

    except requests.exceptions.ConnectionError:
        st.error(
            "Não foi possível conectar ao Supabase. "
            "Confira principalmente a SUPABASE_URL."
        )
        st.code(SUPABASE_URL)
        st.stop()

    except requests.exceptions.Timeout:
        st.error("O Supabase demorou demais para responder.")
        st.stop()

    except requests.exceptions.HTTPError:
        st.error(
            f"O Supabase respondeu com erro HTTP {response.status_code}."
        )
        st.code(response.text)
        st.stop()

    except Exception as e:
        st.error("Erro inesperado ao consultar o Supabase.")
        st.code(str(e))
        st.stop()


def set_status(carga, descarga, usuario):
    now = datetime.now(TZ)

    payload = {
        "carga_aberta": carga,
        "descarga_aberta": descarga,
        "data_referencia": now.date().isoformat(),
        "atualizado_em": now.isoformat(),
        "atualizado_por": usuario or "PORTARIA",
    }

    url = f"{SUPABASE_URL}/rest/v1/totem_status"

    try:
        response = requests.patch(
            url,
            headers=headers(),
            params={
                "id": "eq.1"
            },
            json=payload,
            timeout=15,
        )

        response.raise_for_status()

    except requests.exceptions.ConnectionError:
        st.error("Falha de conexão com o Supabase.")
        st.stop()

    except requests.exceptions.HTTPError:
        st.error(
            f"Erro ao atualizar: HTTP {response.status_code}"
        )
        st.code(response.text)
        st.stop()


if not login():
    st.stop()


st.title("🚛 Controle de Filas - Totem")

st.caption(
    "Controle remoto das filas de carga e descarga."
)

usuario = st.text_input(
    "Operador",
    value=st.session_state.get("operador", "PORTARIA")
)

st.session_state.operador = usuario

status = get_status()

if not status:
    st.error(
        "Registro ID 1 não encontrado na tabela totem_status."
    )
    st.stop()


carga = bool(status["carga_aberta"])
descarga = bool(status["descarga_aberta"])


col1, col2 = st.columns(2)

with col1:

    st.subheader("Carga")

    if carga:
        st.success("🟢 ABERTA")
    else:
        st.error("🔴 ENCERRADA")

    if carga:

        if st.button(
            "🔴 Encerrar Carga",
            use_container_width=True
        ):
            set_status(False, descarga, usuario)
            st.rerun()

    else:

        if st.button(
            "🟢 Reabrir Carga",
            use_container_width=True
        ):
            set_status(True, descarga, usuario)
            st.rerun()


with col2:

    st.subheader("Descarga")

    if descarga:
        st.success("🟢 ABERTA")
    else:
        st.error("🔴 ENCERRADA")

    if descarga:

        if st.button(
            "🔴 Encerrar Descarga",
            use_container_width=True
        ):
            set_status(carga, False, usuario)
            st.rerun()

    else:

        if st.button(
            "🟢 Reabrir Descarga",
            use_container_width=True
        ):
            set_status(carga, True, usuario)
            st.rerun()


st.divider()

col3, col4 = st.columns(2)

with col3:

    if st.button(
        "⛔ ENCERRAR AMBAS",
        type="primary",
        use_container_width=True
    ):
        set_status(False, False, usuario)
        st.rerun()


with col4:

    if st.button(
        "✅ REABRIR AMBAS",
        use_container_width=True
    ):
        set_status(True, True, usuario)
        st.rerun()


st.divider()

st.write(
    "**Última alteração:**",
    status.get("atualizado_em", "-")
)

st.write(
    "**Operador:**",
    status.get("atualizado_por", "-")
)

st.write(
    "**Data de referência:**",
    status.get("data_referencia", "-")
)
