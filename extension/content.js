// ============================================================
// STANG - CONTROLE DE FILAS DO TOTEM
// CONTENT.JS - VERSÃO 2.1.0
// ============================================================

const INTERVALO_ATUALIZACAO = 5000;
const ID_AVISO = "stang-aviso-fila";

let ocultadoTemporariamente = false;
let jaSaiuDaTelaInicialDepoisDoClique = false;
let estadoAnteriorTelaInicial = false;

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function textoDaPagina() {
  return normalizarTexto(document.body?.innerText || "");
}

function estaNaTelaInicial() {
  const texto = textoDaPagina();
  return (
    texto.includes("INICIO") &&
    texto.includes("COMECAR ATENDIMENTO") &&
    texto.includes("CADASTRAR BIOMETRIA FACIAL")
  );
}

function removerAviso() {
  document.getElementById(ID_AVISO)?.remove();
}

function formatarData(data) {
  if (!data) return "";
  const partes = String(data).split("-");
  return partes.length === 3
    ? `${partes[2]}/${partes[1]}/${partes[0]}`
    : String(data);
}

function statusEhDoDia(dados) {
  if (!dados?.data_referencia) return true;
  const hoje = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  return dados.data_referencia === hoje;
}

function mostrarAviso(dados) {
  removerAviso();

  if (!statusEhDoDia(dados)) {
    console.warn("STANG FILAS - status ignorado por ser de outro dia:", dados.data_referencia);
    return;
  }

  const cargaAberta = dados.carga_aberta === true;
  const descargaAberta = dados.descarga_aberta === true;

  if (cargaAberta && descargaAberta) return;

  let titulo = "ATENÇÃO";
  let fila = "";
  let mensagem = "";

  if (!cargaAberta && !descargaAberta) {
    titulo = "ATENDIMENTO ENCERRADO";
    fila = "FILAS DE CARGA E DESCARGA ENCERRADAS";
    mensagem = "Não serão aceitas novas entradas para carga ou descarga no dia de hoje.";
  } else if (!cargaAberta) {
    fila = "FILA DE CARGA ENCERRADA";
    mensagem = "Não serão aceitas novas entradas para carga no dia de hoje.";
  } else {
    fila = "FILA DE DESCARGA ENCERRADA";
    mensagem = "Não serão aceitas novas entradas para descarga no dia de hoje.";
  }

  const painel = document.createElement("div");
  painel.id = ID_AVISO;
  painel.setAttribute("aria-live", "polite");

  painel.innerHTML = `
    <div style="font-size:54px;line-height:1;margin-bottom:12px;">⛔</div>
    <div style="font-size:21px;font-weight:900;text-align:center;margin-bottom:16px;">${titulo}</div>
    <div style="font-size:24px;font-weight:900;line-height:1.2;text-align:center;color:#ffeb3b;margin-bottom:18px;">${fila}</div>
    <div style="font-size:19px;font-weight:800;text-align:center;margin-bottom:18px;">${formatarData(dados.data_referencia)}</div>
    <div style="font-size:15px;line-height:1.45;text-align:center;">${mensagem}</div>
    <div style="width:85%;margin-top:22px;padding-top:16px;border-top:1px solid rgba(255,255,255,.4);font-size:14px;line-height:1.4;font-weight:800;text-align:center;">
      PROCURE A PORTARIA<br>PARA MAIS INFORMAÇÕES
    </div>
  `;

  Object.assign(painel.style, {
    position: "fixed",
    left: "0px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "320px",
    minHeight: "390px",
    boxSizing: "border-box",
    padding: "28px 20px",
    background: "linear-gradient(160deg,#d32f2f 0%,#8b0000 100%)",
    border: "3px solid #ff5252",
    borderLeft: "none",
    borderRadius: "0 18px 18px 0",
    boxShadow: "0 12px 35px rgba(0,0,0,.75)",
    color: "#ffffff",
    zIndex: "2147483647",
    fontFamily: "Arial, Helvetica, sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none"
  });

  document.documentElement.appendChild(painel);
}

function consultarStatus(forcar = false) {
  if (!estaNaTelaInicial()) {
    removerAviso();
    return;
  }

  if (ocultadoTemporariamente) {
    removerAviso();
    return;
  }

  try {
    chrome.runtime.sendMessage(
      { tipo: "BUSCAR_STATUS", forcar },
      (resposta) => {
        if (chrome.runtime.lastError) {
          const msg = chrome.runtime.lastError.message || "";
          if (!msg.includes("Extension context invalidated")) {
            console.warn("STANG FILAS - comunicação:", msg);
          }
          return;
        }

        if (!resposta?.sucesso) {
          console.warn("STANG FILAS - status não recebido:", resposta?.erro || resposta);
          return;
        }

        mostrarAviso(resposta.dados);
      }
    );
  } catch (erro) {
    if (!String(erro).includes("Extension context invalidated")) {
      console.warn("STANG FILAS - erro:", erro);
    }
  }
}

function elementoAcionavelDoClique(alvo) {
  if (!(alvo instanceof Element)) return null;

  const direto = alvo.closest('button, a, [role="button"], input[type="button"], input[type="submit"]');
  if (direto) return direto;

  // Alguns componentes do Sispetro podem usar DIVs clicáveis.
  let atual = alvo;
  for (let i = 0; i < 4 && atual && atual !== document.body; i++, atual = atual.parentElement) {
    const texto = normalizarTexto(atual.innerText || atual.textContent || "");
    if (
      texto.length <= 120 &&
      (texto.includes("COMECAR ATENDIMENTO") || texto.includes("CADASTRAR BIOMETRIA FACIAL"))
    ) {
      return atual;
    }
  }

  return null;
}

document.addEventListener(
  "click",
  (evento) => {
    const acionavel = elementoAcionavelDoClique(evento.target);
    if (!acionavel) return;

    const texto = normalizarTexto(
      acionavel.innerText ||
      acionavel.textContent ||
      acionavel.value ||
      ""
    );

    if (
      texto.includes("COMECAR ATENDIMENTO") ||
      texto.includes("CADASTRAR BIOMETRIA FACIAL")
    ) {
      ocultadoTemporariamente = true;
      jaSaiuDaTelaInicialDepoisDoClique = false;
      removerAviso();
    }
  },
  true
);

function verificarMudancaDeTela() {
  const agoraInicial = estaNaTelaInicial();

  if (ocultadoTemporariamente && !agoraInicial) {
    jaSaiuDaTelaInicialDepoisDoClique = true;
    removerAviso();
  }

  if (
    ocultadoTemporariamente &&
    jaSaiuDaTelaInicialDepoisDoClique &&
    agoraInicial
  ) {
    ocultadoTemporariamente = false;
    jaSaiuDaTelaInicialDepoisDoClique = false;
    setTimeout(() => consultarStatus(true), 300);
  }

  if (!agoraInicial) removerAviso();
  estadoAnteriorTelaInicial = agoraInicial;
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && estaNaTelaInicial()) {
    // Caso o atendimento/biometria tenha aberto outra aba, ao voltar para
    // a aba inicial o aviso deve retornar se a fila continuar encerrada.
    ocultadoTemporariamente = false;
    jaSaiuDaTelaInicialDepoisDoClique = false;
    setTimeout(() => consultarStatus(true), 300);
  }
});

window.addEventListener("pageshow", () => {
  if (estaNaTelaInicial()) {
    ocultadoTemporariamente = false;
    jaSaiuDaTelaInicialDepoisDoClique = false;
    setTimeout(() => consultarStatus(true), 300);
  }
});

const observador = new MutationObserver(() => verificarMudancaDeTela());
observador.observe(document.documentElement, { childList: true, subtree: true });

console.log("STANG FILAS - CONTENT 2.1.0 ATIVO");
estadoAnteriorTelaInicial = estaNaTelaInicial();
setTimeout(() => consultarStatus(true), 800);
setInterval(() => consultarStatus(false), INTERVALO_ATUALIZACAO);
setInterval(verificarMudancaDeTela, 500);
