let aviso = null;
let ocultadoTemporariamente = false;


// ============================================================
// DETECTA A TELA INICIAL PELO CONTEÚDO
// ============================================================

function estaNaTelaInicial() {

  const texto =
    (document.body?.innerText || "")
      .toUpperCase();

  return (
    texto.includes("INÍCIO") &&
    texto.includes("COMEÇAR ATENDIMENTO") &&
    texto.includes("CADASTRAR BIOMETRIA FACIAL")
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

  aviso = null;
}


// ============================================================
// DATA
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
// EXIBE AVISO
// ============================================================

function mostrarAviso(dados) {

  removerAviso();


  const cargaAberta =
    dados.carga_aberta !== false;

  const descargaAberta =
    dados.descarga_aberta !== false;


  if (
    cargaAberta &&
    descargaAberta
  ) {
    return;
  }


  let titulo;
  let fila;
  let mensagem;


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

  else {

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
      font-size:60px;
      margin-bottom:10px;
    ">
      ⛔
    </div>

    <div style="
      font-size:22px;
      font-weight:900;
      margin-bottom:18px;
      text-align:center;
    ">
      ${titulo}
    </div>

    <div style="
      font-size:25px;
      color:#ffeb3b;
      font-weight:900;
      text-align:center;
      line-height:1.25;
      margin-bottom:18px;
    ">
      ${fila}
    </div>

    <div style="
      font-size:22px;
      font-weight:bold;
      margin-bottom:20px;
    ">
      ${formatarData(
        dados.data_referencia
      )}
    </div>

    <div style="
      font-size:16px;
      line-height:1.5;
      text-align:center;
    ">
      ${mensagem}
    </div>

    <div style="
      margin-top:25px;
      padding-top:18px;
      border-top:
        1px solid rgba(255,255,255,.45);
      font-size:15px;
      font-weight:bold;
      text-align:center;
      line-height:1.4;
    ">
      PROCURE A PORTARIA<br>
      PARA MAIS INFORMAÇÕES
    </div>

  `;


  Object.assign(
    painel.style,
    {

      position: "fixed",

      left: "20px",

      top: "50%",

      transform:
        "translateY(-50%)",

      width: "310px",

      minHeight: "410px",

      padding: "28px 22px",

      boxSizing: "border-box",

      background:
        "linear-gradient(160deg,#c62828,#7f0000)",

      border:
        "3px solid #ff5252",

      borderRadius:
        "18px",

      boxShadow:
        "0 15px 40px rgba(0,0,0,.75)",

      color: "#fff",

      zIndex: "2147483647",

      fontFamily:
        "Arial, Helvetica, sans-serif",

      display: "flex",

      flexDirection: "column",

      justifyContent: "center",

      alignItems: "center",

      pointerEvents: "none"

    }
  );


  document.documentElement
    .appendChild(painel);

  aviso = painel;
}


// ============================================================
// CONSULTA BACKGROUND
// ============================================================

function consultar() {

  if (!estaNaTelaInicial()) {

    ocultadoTemporariamente =
      false;

    removerAviso();

    return;
  }


  if (
    ocultadoTemporariamente
  ) {

    removerAviso();
    return;

  }


  try {

    chrome.runtime.sendMessage(
      {
        tipo: "BUSCAR_STATUS"
      },
      function(resposta) {

        if (
          chrome.runtime.lastError
        ) {
          return;
        }

        if (
          !resposta ||
          !resposta.sucesso
        ) {
          return;
        }

        mostrarAviso(
          resposta.dados
        );

      }
    );

  } catch (e) {

    // extensão foi recarregada;
    // a nova aba assumirá o controle.

  }
}


// ============================================================
// CLIQUES
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

    let atual = elemento;

    for (
      let i = 0;
      i < 5 && atual;
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
      texto.toUpperCase();


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
// DETECTA QUANDO VOLTA PARA INÍCIO
// ============================================================

let estavaInicio =
  estaNaTelaInicial();


setInterval(
  function() {

    const agoraInicio =
      estaNaTelaInicial();


    if (
      agoraInicio &&
      !estavaInicio
    ) {

      ocultadoTemporariamente =
        false;

      setTimeout(
        consultar,
        300
      );

    }


    if (!agoraInicio) {

      removerAviso();

    }


    estavaInicio =
      agoraInicio;

  },
  500
);


// ============================================================
// ABA VOLTOU A FICAR VISÍVEL
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
        consultar,
        300
      );

    }

  }
);


// ============================================================
// INÍCIO
// ============================================================

console.log(
  "STANG FILAS 1.2.0 ATIVA"
);


setTimeout(
  consultar,
  700
);


setInterval(
  consultar,
  3000
);
