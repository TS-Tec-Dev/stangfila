import os
from datetime import datetime
from zoneinfo import ZoneInfo

import streamlit as st
from supabase import create_client

TZ = ZoneInfo("America/Sao_Paulo")

st.set_page_config(page_title="Controle de Filas - Totem", page_icon="🚛", layout="centered")

# Secrets expected in Streamlit Cloud:
# SUPABASE_URL = "https://xxxx.supabase.co"
# SUPABASE_SERVICE_KEY = "..."  # service_role key - NEVER put this in the extension
SUPABASE_URL = st.secrets.get("SUPABASE_URL", os.getenv("SUPABASE_URL", ""))
SUPABASE_SERVICE_KEY = st.secrets.get("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_SERVICE_KEY", ""))
ADMIN_PASSWORD = st.secrets.get("ADMIN_PASSWORD", os.getenv("ADMIN_PASSWORD", ""))

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    st.error("Configure SUPABASE_URL e SUPABASE_SERVICE_KEY nos Secrets do Streamlit.")
    st.stop()

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def login():
    if st.session_state.get("auth"):
        return True
    st.title("🔐 Controle de Filas do Totem")
    pwd = st.text_input("Senha administrativa", type="password")
    if st.button("Entrar", use_container_width=True):
        if ADMIN_PASSWORD and pwd == ADMIN_PASSWORD:
            st.session_state.auth = True
            st.rerun()
        else:
            st.error("Senha inválida.")
    return False


def get_status():
    result = supabase.table("totem_status").select("*").eq("id", 1).single().execute()
    return result.data


def set_status(carga: bool, descarga: bool, usuario: str):
    now = datetime.now(TZ)
    payload = {
        "carga_aberta": carga,
        "descarga_aberta": descarga,
        "data_referencia": now.date().isoformat(),
        "atualizado_em": now.isoformat(),
        "atualizado_por": usuario or "PORTARIA",
    }
    supabase.table("totem_status").update(payload).eq("id", 1).execute()


if not login():
    st.stop()

st.title("🚛 Controle de Filas - Totem")
st.caption("O totem consulta este status pela internet, mesmo estando em outra rede.")

usuario = st.text_input("Operador", value=st.session_state.get("operador", "PORTARIA"))
st.session_state.operador = usuario

status = get_status()
if not status:
    st.error("Registro id=1 não encontrado na tabela totem_status.")
    st.stop()

carga = bool(status["carga_aberta"])
descarga = bool(status["descarga_aberta"])

col1, col2 = st.columns(2)
with col1:
    st.subheader("Carga")
    st.success("🟢 ABERTA") if carga else st.error("🔴 ENCERRADA")
    if carga:
        if st.button("🔴 Encerrar Carga", use_container_width=True):
            set_status(False, descarga, usuario)
            st.rerun()
    else:
        if st.button("🟢 Reabrir Carga", use_container_width=True):
            set_status(True, descarga, usuario)
            st.rerun()

with col2:
    st.subheader("Descarga")
    st.success("🟢 ABERTA") if descarga else st.error("🔴 ENCERRADA")
    if descarga:
        if st.button("🔴 Encerrar Descarga", use_container_width=True):
            set_status(carga, False, usuario)
            st.rerun()
    else:
        if st.button("🟢 Reabrir Descarga", use_container_width=True):
            set_status(carga, True, usuario)
            st.rerun()

st.divider()
col3, col4 = st.columns(2)
with col3:
    if st.button("⛔ ENCERRAR AMBAS", type="primary", use_container_width=True):
        set_status(False, False, usuario)
        st.rerun()
with col4:
    if st.button("✅ REABRIR AMBAS", use_container_width=True):
        set_status(True, True, usuario)
        st.rerun()

st.divider()
st.write("**Última alteração:**", status.get("atualizado_em", "-"))
st.write("**Operador:**", status.get("atualizado_por", "-"))
st.write("**Data de referência:**", status.get("data_referencia", "-"))

st.info("A extensão do Chrome mostra o aviso apenas na tela inicial do Sispetro. Ao iniciar atendimento ou biometria, o aviso some e volta quando o usuário retorna ao início.")
