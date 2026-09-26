let painelAtual = null;

let cargaAnterior = null;
let descargaAnterior = null;

let ocultadoPeloClique = false;


// ============================================================
// IDENTIFICA A TELA INICIAL
// ============================================================

function estaNaTelaInicial() {

  const texto =
    (document.body?.innerText || "")
      .toUpperCase();

  const temInicio =
    texto.includes("INÍCIO");

  const temAtendimento =
    texto.includes("COMEÇAR ATENDIMENTO");

  const temBiometria =
    texto.includes("CADASTRAR BIOMETRIA FACIAL");

  return (
    temInicio &&
    (temAtendimento || temBiometria)
  );
}


// ============================================================
// REMOVE AVISO
// ============================================================

function removerAviso() {

  const existente =
    document.getElementById(
      "stang-aviso-fila"
    );

  if (existente) {
    existente.remove();
  }

  painelAtual = null;
}


// ============================================================
// FORMATA DATA
// ============================================================

function formatarData(data) {

  if (!data) {
    return "";
  }

  const partes = data.split("-");

  if (partes.length === 3) {

    return (
      partes[2] +
      "/" +
      partes[1] +
      "/" +
      partes[0]
    );

  }

  return data;
}


// ============================================================
// CRIA AVISO
// ============================================================

function criarAviso(
  cargaAberta,
  descargaAberta,
  dataReferencia
) {

  removerAviso();


  if (
    cargaAberta &&
    descargaAberta
  ) {
    return;
  }


  let titulo = "";
  let fila = "";
  let mensagem = "";


  if (
    !cargaAberta &&
    !descargaAberta
  ) {

    titulo =
      "ATENDIMENTO ENCERRADO";

    fila =
      "FILAS DE CARGA E DESCARGA ENCERRADAS";

    mensagem =
      "Não serão aceitas novas entradas para carga ou descarga no dia de hoje.";

  }

  else if (!cargaAberta) {

    titulo = "ATENÇÃO";

    fila =
      "FILA DE CARGA ENCERRADA";

    mensagem =
      "Não serão aceitas novas entradas para carga no dia de hoje.";

  }

  else {

    titulo = "ATENÇÃO";

    fila =
      "FILA DE DESCARGA ENCERRADA";

    mensagem =
      "Não serão aceitas novas entradas para descarga no dia de hoje.";

  }


  const data =
    formatarData(
      dataReferencia
    );


  const painel =
    document.createElement("div");

  painel.id =
    "stang-aviso-fila";


  painel.innerHTML = `

    <div
      style="
        font-size:52px;
        margin-bottom:12px;
      "
    >
      ⛔
    </div>

    <div
      style="
        font-size:21px;
        font-weight:800;
        text-align:center;
        margin-bottom:16px;
      "
    >
      ${titulo}
    </div>

    <div
      style="
        font-size:25px;
        line-height:1.25;
        font-weight:900;
        text-align:center;
        color:#ffeb3b;
        margin-bottom:20px;
      "
    >
      ${fila}
    </div>

    <div
      style="
        font-size:22px;
        font-weight:bold;
        margin-bottom:20px;
      "
    >
      ${data}
    </div>

    <div
      style="
        font-size:16px;
        line-height:1.45;
        text-align:center;
      "
    >
      ${mensagem}
    </div>

    <div
      style="
        width:80%;
        margin-top:25px;
        padding-top:18px;
        border-top:
          1px solid
          rgba(255,255,255,.4);
        text-align:center;
        font-size:15px;
        font-weight:bold;
        line-height:1.4;
      "
    >
      PROCURE A PORTARIA<br>
      PARA MAIS INFORMAÇÕES
    </div>

  `;


  Object.assign(
    painel.style,
    {

      position: "fixed",

      left: "18px",

      top: "50%",

      transform:
        "translateY(-50%)",

      width: "300px",

      minHeight: "390px",

      boxSizing:
        "border-box",

      padding:
        "28px 20px",

      background:
        "linear-gradient(160deg,#c62828,#7f0000)",

      border:
        "3px solid #ff5252",

      borderRadius:
        "18px",

      boxShadow:
        "0 10px 35px rgba(0,0,0,.75)",

      color:
        "#ffffff",

      zIndex:
        "2147483647",

      fontFamily:
        "Arial, Helvetica, sans-serif",

      display:
        "flex",

      flexDirection:
        "column",

      alignItems:
        "center",

      justifyContent:
        "center",

      pointerEvents:
        "none"

    }
  );


  document.documentElement
    .appendChild(painel);

  painelAtual = painel;
}


// ============================================================
// BUSCA STATUS
// ============================================================

function consultarStatus() {

  if (!estaNaTelaInicial()) {

    removerAviso();

    cargaAnterior = null;
    descargaAnterior = null;

    return;
  }


  if (ocultadoPeloClique) {

    removerAviso();

    return;
  }


  chrome.runtime.sendMessage(
    {
      tipo: "BUSCAR_STATUS"
    },
    (resposta) => {

      if (
        chrome.runtime.lastError
      ) {

        console.error(
          "Erro extensão:",
          chrome.runtime.lastError
        );

        return;
      }


      if (
        !resposta ||
        !resposta.sucesso
      ) {

        console.error(
          "Não foi possível obter o status.",
          resposta
        );

        return;
      }


      const dados =
        resposta.dados;


      const cargaAberta =
        dados.carga_aberta !== false;


      const descargaAberta =
        dados.descarga_aberta !== false;


      cargaAnterior =
        cargaAberta;

      descargaAnterior =
        descargaAberta;


      criarAviso(
        cargaAberta,
        descargaAberta,
        dados.data_referencia
      );

    }
  );
}


// ============================================================
// DETECTA CLIQUE NOS BOTÕES
// ============================================================

document.addEventListener(
  "click",
  (evento) => {

    let elemento =
      evento.target;


    if (!elemento) {
      return;
    }


    let texto =
      (
        elemento.innerText ||
        elemento.textContent ||
        ""
      )
      .trim()
      .toUpperCase();


    // Procura também elementos pais.
    let pai = elemento.parentElement;

    for (
      let i = 0;
      i < 4 && pai;
      i++
    ) {

      texto +=
        " " +
        (
          pai.innerText ||
          pai.textContent ||
          ""
        )
        .trim()
        .toUpperCase();

      pai =
        pai.parentElement;

    }


    if (
      texto.includes(
        "COMEÇAR ATENDIMENTO"
      ) ||
      texto.includes(
        "CADASTRAR BIOMETRIA FACIAL"
      )
    ) {

      ocultadoPeloClique = true;

      removerAviso();

    }

  },
  true
);


// ============================================================
// DETECTA ALTERAÇÃO DA TELA
// ============================================================

let estavaNaTelaInicial =
  estaNaTelaInicial();


function verificarTela() {

  const agoraNaTelaInicial =
    estaNaTelaInicial();


  // Saiu da tela inicial.
  if (
    estavaNaTelaInicial &&
    !agoraNaTelaInicial
  ) {

    removerAviso();

  }


  // Voltou para a tela inicial.
  if (
    !estavaNaTelaInicial &&
    agoraNaTelaInicial
  ) {

    ocultadoPeloClique =
      false;

    cargaAnterior = null;
    descargaAnterior = null;

    setTimeout(
      consultarStatus,
      300
    );

  }


  estavaNaTelaInicial =
    agoraNaTelaInicial;
}


// ============================================================
// SE O ATENDIMENTO ABRIR OUTRA ABA
// ============================================================

document.addEventListener(
  "visibilitychange",
  () => {

    // Cliente voltou para o totem.
    if (
      document.visibilityState ===
      "visible"
    ) {

      if (
        estaNaTelaInicial()
      ) {

        ocultadoPeloClique =
          false;

        setTimeout(
          consultarStatus,
          300
        );

      }

    }

  }
);


// ============================================================
// INICIALIZA
// ============================================================

console.log(
  "STANG FILAS - EXTENSÃO INICIADA"
);


setTimeout(
  consultarStatus,
  500
);


// Consulta status periodicamente.
setInterval(
  consultarStatus,
  3000
);


// Detecta mudança das telas.
setInterval(
  verificarTela,
  500
);
