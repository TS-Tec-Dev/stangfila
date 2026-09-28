// ============================================================
// CONFIGURAÇÕES
// ============================================================

// COLE AQUI O TOKEN DE LEITURA DO GITHUB
const GITHUB_TOKEN = "COLE_AQUI_SEU_TOKEN";

const API_URL =
  "https://api.github.com/repos/TS-Tec-Dev/stangfila/contents/status.json";


// ============================================================
// RECEBE SOLICITAÇÕES DO CONTENT.JS
// ============================================================

chrome.runtime.onMessage.addListener(
  function (mensagem, sender, sendResponse) {

    if (
      !mensagem ||
      mensagem.tipo !== "BUSCAR_STATUS"
    ) {
      return;
    }

    buscarStatus()
      .then(function (dados) {

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

    // Necessário porque a resposta é assíncrona.
    return true;
  }
);


// ============================================================
// CONSULTA O STATUS.JSON NO GITHUB
// ============================================================

async function buscarStatus() {

  // O parâmetro "_" muda a URL em cada consulta,
  // evitando receber uma resposta antiga.
  const url =
    API_URL +
    "?ref=main&_=" +
    Date.now();


  const resposta = await fetch(
    url,
    {
      method: "GET",

      headers: {
        "Accept":
          "application/vnd.github+json",

        "Authorization":
          `Bearer ${GITHUB_TOKEN}`,

        "X-GitHub-Api-Version":
          "2022-11-28"
      }
    }
  );


  // ==========================================================
  // VERIFICA ERRO HTTP
  // ==========================================================

  if (!resposta.ok) {

    const textoErro =
      await resposta.text();

    throw new Error(
      "GitHub HTTP " +
      resposta.status +
      " - " +
      textoErro
    );

  }


  // ==========================================================
  // RECEBE INFORMAÇÕES DO ARQUIVO
  // ==========================================================

  const arquivo =
    await resposta.json();


  if (!arquivo.content) {

    throw new Error(
      "O GitHub não retornou o conteúdo de status.json."
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
  // TRANSFORMA EM JSON
  // ==========================================================

  const dados =
    JSON.parse(texto);


  // ==========================================================
  // VALIDA O ARQUIVO
  // ==========================================================

  if (
    typeof dados.carga_aberta !== "boolean" ||
    typeof dados.descarga_aberta !== "boolean"
  ) {

    throw new Error(
      "status.json está em formato inválido."
    );

  }


  // ==========================================================
  // MOSTRA NO CONSOLE PARA DIAGNÓSTICO
  // ==========================================================

  console.clear();

  console.log(
    "=========================================="
  );

  console.log(
    "STANG - CONTROLE DE FILAS"
  );

  console.log(
    "=========================================="
  );


  console.log(
    "CARGA:",
    dados.carga_aberta
      ? "🟢 ABERTA"
      : "🔴 ENCERRADA"
  );


  console.log(
    "DESCARGA:",
    dados.descarga_aberta
      ? "🟢 ABERTA"
      : "🔴 ENCERRADA"
  );


  console.log(
    "DATA:",
    dados.data_referencia
  );


  console.log(
    "ATUALIZADO EM:",
    dados.atualizado_em
  );


  console.log(
    "OPERADOR:",
    dados.atualizado_por
  );


  console.log(
    "=========================================="
  );


  return dados;
}
