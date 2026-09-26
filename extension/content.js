let aviso = null;
let ocultadoTemporariamente = false;


// ============================================================
// DETECTA SE ESTÁ NA TELA INICIAL DO SISPetro
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
    temAtendimento &&
    temBiometria
  );
}


// ============================================================
// REMOVE O AVISO DA TELA
// ============================================================

function removerAviso() {

  const existente =
    document.getElementById("stang-aviso-fila");

  if (existente) {
    existente.remove();
  }

  aviso = null;
}


// ============================================================
// FORMATA DATA YYYY-MM-DD PARA DD/MM/YYYY
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
// MONTA O PAINEL DE AVISO
// ============================================================

function mostrarAviso(dados) {

  removerAviso();


  const cargaAberta =
    dados.carga_aberta !== false;

  const descargaAberta =
    dados.descarga_aberta !== false;


  // Se as duas filas estiverem abertas, não mostra nada.
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
      "CARGA E DESCARGA";

    mensagem =
      "As filas de carga e descarga foram encerradas para o dia de hoje.";

  }

  else if (!cargaAberta) {

    titulo =
      "ATENÇÃO";

    fila =
      "FILA DE CARGA ENCERRADA";

    mensagem =
      "Não serão aceitas novas entradas para carga no dia de hoje.";

  }

  else if (!descargaAberta) {

    titulo =
      "ATENÇÃO";

    fila =
      "FILA DE DESCARGA ENCERRADA";

    mensagem =
      "Não serão aceitas novas entradas para descarga no dia de hoje.";

  }


  const painel =
    document.createElement("div");


  painel.id =
    "stang-aviso-fila";


  painel.innerHTML = `

    <div style="
      font-size:56px;
      margin-bottom:12px;
      line-height:1;
    ">
      ⛔
    </div>

    <div style="
      font-size:20px;
      font-weight:900;
      margin-bottom:16px;
      text-align:center;
      color:#ffffff;
    ">
      ${titulo}
    </div>

    <div style="
      font-size:24px;
      font-weight:900;
      line-height:1.2;
      text-align:center;
      color:#ffeb3b;
      margin-bottom:18px;
    ">
      ${fila}
    </div>

    <div style="
      font-size:20px;
      font-weight:800;
      text-align:center;
      color:#ffffff;
      margin-bottom:18px;
    ">
      ${formatarData(dados.data_referencia)}
    </div>

    <div style="
      font-size:15px;
      line-height:1.45;
      text-align:center;
      color:#ffffff;
    ">
      ${mensagem}
    </div>

    <div style="
      width:85%;
      margin-top:22px;
      padding-top:16px;
      border-top:1px solid rgba(255,255,255,0.40);
      font-size:14px;
      line-height:1.4;
      font-weight:800;
      text-align:center;
      color:#ffffff;
    ">
      PROCURE A SUA DISTRIBUIDORA<br>
      PARA REAGENDAMENTO!
    </div>

  `;


  Object.assign(
    painel.style,
    {

      position: "fixed",

      left: "0px",

      top: "50%",

      transform:
        "translateY(-50%)",

      width: "320px",

      minHeight: "390px",

      boxSizing: "border-box",

      padding: "28px 20px",

      background:
        "linear-gradient(160deg,#d32f2f 0%,#8b0000 100%)",

      border:
        "3px solid #ff5252",

      borderLeft:
        "none",

      borderRadius:
        "0 18px 18px 0",

      boxShadow:
        "0 12px 35px rgba(0,0,0,0.70)",

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

      justifyContent:
        "center",

      alignItems:
        "center",

      pointerEvents:
        "none"

    }
  );


  document.documentElement
    .appendChild(painel);


  aviso = painel;
}


// ============================================================
// CONSULTA O BACKGROUND.JS
// ============================================================

function consultarStatus() {

  // Se não estiver na tela inicial, não mostra nada.
  if (!estaNaTelaInicial()) {

    ocultadoTemporariamente = false;

    removerAviso();

    return;
  }


  // Se o cliente acabou de clicar em atendimento/biometria,
  // mantém escondido enquanto a tela ainda não mudou.
  if (ocultadoTemporariamente) {

    removerAviso();

    return;
  }


  try {

    chrome.runtime.sendMessage(
      {
        tipo: "BUSCAR_STATUS"
      },

      function(resposta) {

        if (chrome.runtime.lastError) {

          const erro =
            chrome.runtime.lastError.message || "";

          if (
            erro.includes(
              "Extension context invalidated"
            )
          ) {
            return;
          }

          console.warn(
            "STANG FILAS - erro:",
            erro
          );

          return;
        }


        if (
          !resposta ||
          !resposta.sucesso
        ) {

          console.warn(
            "STANG FILAS - status não recebido.",
            resposta
          );

          return;
        }


        console.log(
          "STANG FILAS - STATUS:",
          resposta.dados
        );


        mostrarAviso(
          resposta.dados
        );

      }
    );

  }

  catch (erro) {

    if (
      String(erro).includes(
        "Extension context invalidated"
      )
    ) {
      return;
    }

    console.warn(
      "STANG FILAS:",
      erro
    );

  }
}


// ============================================================
// DETECTA CLIQUE EM COMEÇAR ATENDIMENTO / BIOMETRIA
// ============================================================

document.addEventListener(
  "click",

  function(evento) {

    let elemento =
      evento.target;

    if (!elemento) {
      return;
    }


    let texto = "";

    let atual =
      elemento;


    // Procura o texto no elemento e também nos pais.
    for (
      let i = 0;
      i < 6 && atual;
      i++
    ) {

      texto +=
        " " +
        (
          atual.innerText ||
          atual.textContent ||
          ""
        );

      atual =
        atual.parentElement;
    }


    texto =
      texto
        .trim()
        .toUpperCase();


    if (
      texto.includes(
        "COMEÇAR ATENDIMENTO"
      ) ||
      texto.includes(
        "CADASTRAR BIOMETRIA FACIAL"
      )
    ) {

      ocultadoTemporariamente =
        true;

      removerAviso();

    }

  },

  true
);


// ============================================================
// DETECTA SE SAIU OU VOLTOU PARA A TELA INICIAL
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

    ocultadoTemporariamente =
      false;

    setTimeout(
      consultarStatus,
      500
    );

  }


  estavaNaTelaInicial =
    agoraNaTelaInicial;
}


// ============================================================
// QUANDO O CLIENTE VOLTAR PARA A ABA DO TOTEM
// ============================================================

document.addEventListener(
  "visibilitychange",

  function() {

    if (
      document.visibilityState ===
      "visible" &&
      estaNaTelaInicial()
    ) {

      ocultadoTemporariamente =
        false;

      setTimeout(
        consultarStatus,
        500
      );

    }

  }
);


// ============================================================
// INICIALIZAÇÃO
// ============================================================

console.log(
  "STANG FILAS - CONTENT 1.3.0 INICIADO"
);


// Primeira consulta.
setTimeout(
  consultarStatus,
  700
);


// Atualiza o status a cada 10 segundos.
const intervaloStatus =
  setInterval(
    function() {

      try {

        if (
          typeof chrome === "undefined" ||
          !chrome.runtime ||
          !chrome.runtime.id
        ) {

          clearInterval(
            intervaloStatus
          );

          return;
        }


        consultarStatus();

      }

      catch (erro) {

        clearInterval(
          intervaloStatus
        );

      }

    },

    10000
  );


// Monitora mudança da tela a cada meio segundo.
const intervaloTela =
  setInterval(
    function() {

      try {

        if (
          typeof chrome === "undefined" ||
          !chrome.runtime ||
          !chrome.runtime.id
        ) {

          clearInterval(
            intervaloTela
          );

          return;
        }


        verificarTela();

      }

      catch (erro) {

        clearInterval(
          intervaloTela
        );

      }

    },

    500
  );
