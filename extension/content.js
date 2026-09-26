const STATUS_URL =
  "https://raw.githubusercontent.com/TS-Tec-Dev/stangfila/main/status.json";

const HOME_PATH = "/home/outros/modo_auto_atendimento";

let avisoAtual = null;
let ultimaCarga = null;
let ultimaDescarga = null;


// ============================================================
// VERIFICA SE ESTAMOS NA TELA INICIAL
// ============================================================

function estaNaTelaInicial() {
  return window.location.pathname === HOME_PATH;
}


// ============================================================
// REMOVE AVISO
// ============================================================

function removerAviso() {
  const aviso = document.getElementById("stang-aviso-fila");

  if (aviso) {
    aviso.remove();
  }

  avisoAtual = null;
}


// ============================================================
// MONTA AVISO
// ============================================================

function criarAviso(cargaAberta, descargaAberta, dataReferencia) {

  removerAviso();

  // Se ambas estiverem abertas, não mostra nada.
  if (cargaAberta && descargaAberta) {
    return;
  }

  const painel = document.createElement("div");
  painel.id = "stang-aviso-fila";

  let titulo = "";
  let subtitulo = "";

  if (!cargaAberta && !descargaAberta) {

    titulo = "ATENDIMENTO ENCERRADO";
    subtitulo = "FILAS DE CARGA E DESCARGA ENCERRADAS";

  } else if (!cargaAberta) {

    titulo = "ATENÇÃO";
    subtitulo = "FILA DE CARGA ENCERRADA";

  } else if (!descargaAberta) {

    titulo = "ATENÇÃO";
    subtitulo = "FILA DE DESCARGA ENCERRADA";

  }


  const dataFormatada = formatarData(dataReferencia);


  painel.innerHTML = `
    <div style="
      font-size: 46px;
      margin-bottom: 12px;
    ">
      ⛔
    </div>

    <div style="
      font-size: 22px;
      font-weight: 800;
      margin-bottom: 18px;
      color: #ffffff;
      text-align: center;
    ">
      ${titulo}
    </div>

    <div style="
      font-size: 25px;
      line-height: 1.25;
      font-weight: 900;
      text-align: center;
      color: #ffeb3b;
      margin-bottom: 20px;
    ">
      ${subtitulo}
    </div>

    <div style="
      font-size: 21px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 20px;
    ">
      ${dataFormatada}
    </div>

    <div style="
      font-size: 16px;
      line-height: 1.5;
      text-align: center;
      color: #ffffff;
    ">
      Não serão aceitas novas entradas para esta fila no dia de hoje.
    </div>

    <div style="
      margin-top: 22px;
      padding: 12px;
      border-top: 1px solid rgba(255,255,255,.35);
      font-size: 15px;
      line-height: 1.4;
      text-align: center;
      font-weight: 700;
      color: white;
    ">
      PROCURE A PORTARIA<br>
      PARA MAIS INFORMAÇÕES
    </div>
  `;


  // ==========================================================
  // POSIÇÃO EXATAMENTE NA LATERAL ESQUERDA
  // ==========================================================

  Object.assign(painel.style, {

    position: "fixed",

    left: "20px",

    top: "90px",

    width: "315px",

    minHeight: "390px",

    padding: "28px 22px",

    background:
      "linear-gradient(160deg, #b71c1c 0%, #7f0000 100%)",

    color: "white",

    borderRadius: "16px",

    border: "2px solid #ff5252",

    boxShadow:
      "0 15px 40px rgba(0,0,0,.55)",

    zIndex: "2147483647",

    fontFamily:
      "Arial, Helvetica, sans-serif",

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    alignItems: "center",

    pointerEvents: "none"

  });


  document.body.appendChild(painel);

  avisoAtual = painel;
}


// ============================================================
// FORMATA DATA
// ============================================================

function formatarData(data) {

  if (!data) {
    return "";
  }

  try {

    const partes = data.split("-");

    if (partes.length === 3) {

      return `${partes[2]}/${partes[1]}/${partes[0]}`;

    }

  } catch (e) {}

  return data;
}


// ============================================================
// CONSULTA STATUS NO GITHUB
// ============================================================

async function consultarStatus() {

  // Se saiu da tela inicial, retira imediatamente.
  if (!estaNaTelaInicial()) {
    removerAviso();
    return;
  }

  try {

    // Evita cache do GitHub Raw.
    const url =
      STATUS_URL +
      "?t=" +
      new Date().getTime();

    const resposta = await fetch(
      url,
      {
        cache: "no-store"
      }
    );

    if (!resposta.ok) {
      return;
    }

    const dados = await resposta.json();


    const cargaAberta =
      dados.carga_aberta !== false;

    const descargaAberta =
      dados.descarga_aberta !== false;


    // Não precisa recriar a mensagem se não mudou.
    if (
      cargaAberta === ultimaCarga &&
      descargaAberta === ultimaDescarga &&
      avisoAtual
    ) {
      return;
    }


    ultimaCarga = cargaAberta;
    ultimaDescarga = descargaAberta;


    criarAviso(
      cargaAberta,
      descargaAberta,
      dados.data_referencia
    );

  } catch (erro) {

    console.log(
      "Erro ao consultar status da fila:",
      erro
    );

  }
}


// ============================================================
// SOME AO CLICAR NOS BOTÕES
// ============================================================

function observarCliques() {

  document.addEventListener(
    "click",
    function(evento) {

      const elemento = evento.target;

      if (!elemento) {
        return;
      }

      const texto =
        (elemento.innerText || "")
          .trim()
          .toUpperCase();


      if (
        texto.includes("COMEÇAR ATENDIMENTO") ||
        texto.includes("CADASTRAR BIOMETRIA FACIAL")
      ) {

        removerAviso();

      }

    },
    true
  );

}


// ============================================================
// DETECTA MUDANÇAS INTERNAS DA PÁGINA
// ============================================================

let urlAnterior = window.location.href;

function monitorarNavegacao() {

  const urlAtual = window.location.href;

  if (urlAtual !== urlAnterior) {

    urlAnterior = urlAtual;

    if (!estaNaTelaInicial()) {

      removerAviso();

    } else {

      ultimaCarga = null;
      ultimaDescarga = null;

      setTimeout(
        consultarStatus,
        500
      );

    }

  }

}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

observarCliques();

consultarStatus();


// Consulta GitHub a cada 3 segundos.
setInterval(
  consultarStatus,
  3000
);


// Verifica se mudou de página.
setInterval(
  monitorarNavegacao,
  500
);
