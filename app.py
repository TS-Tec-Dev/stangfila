import os
import socket
import requests
import streamlit as st

st.set_page_config(
    page_title="Teste Supabase",
    page_icon="🧪",
)

SUPABASE_URL = st.secrets.get(
    "SUPABASE_URL",
    os.getenv("SUPABASE_URL", "")
).strip().rstrip("/")

SUPABASE_SERVICE_KEY = st.secrets.get(
    "SUPABASE_SERVICE_KEY",
    os.getenv("SUPABASE_SERVICE_KEY", "")
).strip()


st.title("🧪 Diagnóstico Supabase")

st.write("URL configurada:")
st.code(SUPABASE_URL)


# TESTE 1 - DNS
st.subheader("1. Teste de DNS")

try:
    host = SUPABASE_URL.replace("https://", "").replace("http://", "")
    host = host.split("/")[0]

    ip = socket.getaddrinfo(host, 443)

    st.success("DNS funcionando")
    st.code(f"{host} → {ip}")

except Exception as e:
    st.error("Falha ao resolver o endereço do Supabase.")
    st.code(repr(e))
    st.stop()


# TESTE 2 - conexão HTTPS
st.subheader("2. Teste de conexão HTTPS")

try:

    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        },
        timeout=20,
    )

    st.write("Status HTTP:")
    st.code(str(r.status_code))

    st.write("Resposta:")
    st.code(r.text[:2000])

except Exception as e:

    st.error("Falha na conexão HTTPS.")
    st.code(repr(e))
    st.stop()


# TESTE 3 - tabela
st.subheader("3. Teste da tabela")

try:

    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/totem_status",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        },
        params={
            "select": "*",
            "id": "eq.1",
        },
        timeout=20,
    )

    st.write("Status HTTP:")
    st.code(str(r.status_code))

    st.write("Resposta:")
    st.code(r.text[:2000])

except Exception as e:

    st.error("Erro ao consultar a tabela.")
    st.code(repr(e))
