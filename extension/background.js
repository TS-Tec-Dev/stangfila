// ============================================================
// CONFIGURAÇÃO
// ============================================================

// IMPORTANTE:
// Cole o token ENTRE AS ASPAS e em UMA ÚNICA LINHA.
const GITHUB_TOKEN = "COLE_AQUI_SEU_TOKEN_GITHUB";

const API_URL =
  "https://api.github.com/repos/TS-Tec-Dev/stangfila/contents/status.json?ref=main";


// ============================================================
// RECEBE MENSAGEM DO CONTENT.JS
// ============================================================

chrome.runtime.onMessage.addListener(
  function (mensagem, sender, sendResponse) {

    if (!mensagem || mensagem.tipo !== "BUSCAR_STATUS") {
      return;
    }

    buscarStatus()
      .then(function (dados) {

        console.log(
          "STANG FILAS - STATUS RECEBIDO:",
          dados
        );

        sendResponse({
          sucesso: true,
          dados: dados
        });

      })
      .catch(function (erro) {

        console.error(
          "STANG FILAS - ERRO:",
          erro
        );

        sendResponse({
          sucesso: false,
          erro: String(erro)
        });

      });

    // Mantém a resposta assíncrona aberta.
    return true;
  }
);


// ============================================================
// CONSULTA STATUS.JSON NO GITHUB
// ============================================================

async function buscarStatus() {

  const url =
    API_URL +
    "&nocache=" +
    Date.now();


  const resposta = await fetch(
    url,
    {
      method: "GET",

      cache: "no-store",

      headers: {
        "Accept": "application/vnd.github+json",

        "Authorization": `Bearer ${GITHUB_TOKEN}`,

        "X-GitHub-Api-Version": "2022-11-28",

        "Cache-Control": "no-cache"
      }
    }
  );


  // ==========================================================
  // VERIFICA ERRO HTTP
  // ==========================================================

  if (!resposta.ok) {

    const respostaErro =
      await resposta.text();

    throw new Error(
      "GitHub HTTP " +
      resposta.status +
      " - " +
      respostaErro
    );
  }


  // ==========================================================
  // RECEBE ARQUIVO
  // ==========================================================

  const arquivo =
    await resposta.json();


  if (!arquivo.content) {

    throw new Error(
      "O GitHub não retornou o conteúdo do status.json."
    );
  }


  // ==========================================================
  // DECODIFICA BASE64
  // ==========================================================

  const base64 =
    arquivo.content.replace(
      /\n/g,
      ""
    );


  const binario =
    atob(base64);


  const bytes =
    Uint8Array.from(
      binario,
      function (caractere) {

        return caractere.charCodeAt(0);

      }
    );


  const texto =
    new TextDecoder(
      "utf-8"
    ).decode(bytes);


  // ==========================================================
  // CONVERTE JSON
  // ==========================================================

  const dados =
    JSON.parse(texto);


  // ==========================================================
  // VALIDA
  // ==========================================================

  if (
    typeof dados.carga_aberta !== "boolean" ||
    typeof dados.descarga_aberta !== "boolean"
  ) {

    throw new Error(
      "O status.json possui formato inválido."
    );
  }


  // ==========================================================
  // LOG PARA DIAGNÓSTICO
  // ==========================================================

  console.log(
    "========================================"
  );

  console.log(
    "STANG FILAS - STATUS ATUAL"
  );

  console.log(
    "Carga:",
    dados.carga_aberta
      ? "ABERTA"
      : "ENCERRADA"
  );

  console.log(
    "Descarga:",
    dados.descarga_aberta
      ? "ABERTA"
      : "ENCERRADA"
  );

  console.log(
    "Data:",
    dados.data_referencia
  );

  console.log(
    "Atualizado em:",
    dados.atualizado_em
  );

  console.log(
    "Atualizado por:",
    dados.atualizado_por
  );

  console.log(
    "========================================"
  );


  return dados;
}
