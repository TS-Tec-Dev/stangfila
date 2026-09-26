// ===============================
// CONFIGURE AQUI
// ===============================
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "COLE_AQUI_SUA_ANON_KEY";

// Tela inicial informada pelo usuário.
const HOME_PATH = "/home/outros/modo_auto_atendimento";
const POLL_MS = 3000;

const PANEL_ID = "stang-fila-aviso";

function isHomeScreen() {
  // Primeiro critério: URL inicial.
  const pathOk = window.location.pathname.replace(/\/$/, "") === HOME_PATH;

  // Segundo critério ajuda em SPA: procura o título INÍCIO e os botões principais.
  const bodyText = (document.body?.innerText || "").toUpperCase();
  const looksLikeHome = bodyText.includes("INÍCIO") &&
    (bodyText.includes("COMEÇAR ATENDIMENTO") || bodyText.includes("CADASTRAR BIOMETRIA FACIAL"));

  return pathOk && looksLikeHome;
}

function removePanel() {
  document.getElementById(PANEL_ID)?.remove();
}

function formatDateBR(isoDate) {
  if (!isoDate) return new Date().toLocaleDateString("pt-BR");
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function buildMessage(status) {
  const carga = !!status.carga_aberta;
  const descarga = !!status.descarga_aberta;

  if (carga && descarga) return null;

  if (!carga && !descarga) {
    return {
      title: "ATENDIMENTO ENCERRADO",
      main: "FILAS DE CARGA E DESCARGA ENCERRADAS",
      detail: "Não serão aceitas novas entradas de carga ou descarga no dia de hoje."
    };
  }

  if (!carga) {
    return {
      title: "ATENÇÃO",
      main: "FILA DE CARGA ENCERRADA",
      detail: "Não serão aceitas novas entradas para carga no dia de hoje."
    };
  }

  return {
    title: "ATENÇÃO",
    main: "FILA DE DESCARGA ENCERRADA",
    detail: "Não serão aceitas novas entradas para descarga no dia de hoje."
  };
}

function showPanel(status) {
  const msg = buildMessage(status);
  if (!msg) {
    removePanel();
    return;
  }

  let panel = document.getElementById(PANEL_ID);
  if (!panel) {
    panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.style.cssText = `
      position: fixed;
      left: 18px;
      top: 82px;
      width: 320px;
      min-height: 360px;
      z-index: 2147483647;
      background: linear-gradient(180deg, #9b111e 0%, #5f0710 100%);
      color: white;
      border: 4px solid #ffcb00;
      border-radius: 18px;
      box-shadow: 0 12px 35px rgba(0,0,0,.55);
      padding: 26px 22px;
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
      text-align: center;
      pointer-events: none;
    `;
    document.documentElement.appendChild(panel);
  }

  panel.innerHTML = `
    <div style="font-size:56px;line-height:1;margin-bottom:14px">⛔</div>
    <div style="font-size:22px;font-weight:900;letter-spacing:.5px;margin-bottom:14px">${msg.title}</div>
    <div style="font-size:25px;font-weight:900;line-height:1.18;margin-bottom:18px">${msg.main}</div>
    <div style="display:inline-block;background:#ffcb00;color:#161616;font-size:22px;font-weight:900;padding:8px 16px;border-radius:10px;margin-bottom:18px">
      ${formatDateBR(status.data_referencia)}
    </div>
    <div style="font-size:17px;line-height:1.45;margin-bottom:18px">${msg.detail}</div>
    <div style="font-size:18px;font-weight:800;color:#ffdf59">PROCURE A PORTARIA PARA MAIS INFORMAÇÕES</div>
  `;
}

async function fetchStatus() {
  const url = `${SUPABASE_URL}/rest/v1/totem_status?id=eq.1&select=id,carga_aberta,descarga_aberta,data_referencia,atualizado_em,atualizado_por&t=${Date.now()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data?.[0] || null;
}

async function refresh() {
  try {
    // Regra solicitada: aviso somente na tela inicial.
    if (!isHomeScreen()) {
      removePanel();
      return;
    }

    const status = await fetchStatus();
    if (!status) {
      removePanel();
      return;
    }

    // Segurança contra aviso de um dia anterior: se a data no banco não for hoje,
    // não mostra alerta até o painel ser atualizado no dia atual.
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    if (status.data_referencia !== today) {
      removePanel();
      return;
    }

    showPanel(status);
  } catch (err) {
    console.warn("Aviso de filas: não foi possível consultar o status", err);
    // Em falha de internet, não bloqueia o atendimento; mantém o site original utilizável.
    removePanel();
  }
}

// Detecta navegação em SPA e mudanças de tela.
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    refresh();
  }
});
observer.observe(document.documentElement, { subtree: true, childList: true });

// Se o clique leva a outra tela/aba interativa, o aviso some imediatamente.
document.addEventListener("click", (ev) => {
  const el = ev.target.closest("button, a, [role='button']");
  if (!el) return;
  const text = (el.innerText || el.textContent || "").trim().toUpperCase();
  if (text.includes("COMEÇAR ATENDIMENTO") || text.includes("CADASTRAR BIOMETRIA FACIAL")) {
    removePanel();
  }
}, true);

refresh();
setInterval(refresh, POLL_MS);
