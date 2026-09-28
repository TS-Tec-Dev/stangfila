// ============================================================
// STANG - CONTROLE DE FILAS DO TOTEM
// BACKGROUND.JS - VERSÃO 2.1.0
// ============================================================

const PADRAO = {
  owner: "TS-Tec-Dev",
  repo: "stangfila",
  branch: "main",
  token: ""
};

let ultimoStatus = null;
let ultimaConsulta = 0;
const CACHE_INTERNO_MS = 2500;

chrome.runtime.onInstalled.addListener(async () => {
  const atual = await chrome.storage.local.get(PADRAO);
  await chrome.storage.local.set({
    owner: atual.owner || PADRAO.owner,
    repo: atual.repo || PADRAO.repo,
    branch: atual.branch || PADRAO.branch,
    token: atual.token || ""
  });
});

chrome.runtime.onMessage.addListener((mensagem, sender, sendResponse) => {
  if (!mensagem || !mensagem.tipo) return;

  if (mensagem.tipo === "BUSCAR_STATUS") {
    buscarStatus(Boolean(mensagem.forcar))
      .then((dados) => sendResponse({ sucesso: true, dados }))
      .catch((erro) => {
        console.error("STANG FILAS - ERRO:", erro);
        sendResponse({ sucesso: false, erro: String(erro?.message || erro) });
      });
    return true;
  }

  if (mensagem.tipo === "TESTAR_CONFIG") {
    testarConfiguracao()
      .then((dados) => sendResponse({ sucesso: true, dados }))
      .catch((erro) => sendResponse({ sucesso: false, erro: String(erro?.message || erro) }));
    return true;
  }
});

async function carregarConfiguracao() {
  const cfg = await chrome.storage.local.get(PADRAO);
  return {
    owner: (cfg.owner || PADRAO.owner).trim(),
    repo: (cfg.repo || PADRAO.repo).trim(),
    branch: (cfg.branch || PADRAO.branch).trim(),
    token: (cfg.token || "").trim()
  };
}

async function buscarStatus(forcar = false) {
  const agora = Date.now();

  if (!forcar && ultimoStatus && (agora - ultimaConsulta) < CACHE_INTERNO_MS) {
    return ultimoStatus;
  }

  const cfg = await carregarConfiguracao();

  if (!cfg.token) {
    throw new Error("Token de leitura não configurado. Abra as opções da extensão e informe o token do GitHub.");
  }

  const url =
    `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}` +
    `/contents/status.json?ref=${encodeURIComponent(cfg.branch)}&_=${Date.now()}`;

  const resposta = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${cfg.token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(`GitHub HTTP ${resposta.status} - ${detalhe}`);
  }

  const arquivo = await resposta.json();
  if (!arquivo.content) {
    throw new Error("O GitHub não retornou o conteúdo de status.json.");
  }

  const base64 = arquivo.content.replace(/\n/g, "");
  const binario = atob(base64);
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  const texto = new TextDecoder("utf-8").decode(bytes);
  const dados = JSON.parse(texto);

  if (
    typeof dados.carga_aberta !== "boolean" ||
    typeof dados.descarga_aberta !== "boolean"
  ) {
    throw new Error("status.json está em formato inválido.");
  }

  ultimoStatus = dados;
  ultimaConsulta = Date.now();

  console.log("STANG FILAS - STATUS RECEBIDO:", dados);
  return dados;
}

async function testarConfiguracao() {
  ultimoStatus = null;
  ultimaConsulta = 0;
  return await buscarStatus(true);
}
