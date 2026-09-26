const STATUS_URL =
  "https://raw.githubusercontent.com/TS-Tec-Dev/stangfila/main/status.json";


// ============================================================
// RECEBE PEDIDO DO CONTENT.JS
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


    // Mantém o canal aberto para resposta assíncrona.
    return true;
  }
);


// ============================================================
// BUSCA O STATUS.JSON
// ============================================================

async function buscarStatus() {

  // Timestamp evita usar cópia antiga em cache.
  const url =
    STATUS_URL +
    "?nocache=" +
    Date.now();


  const resposta =
    await fetch(
      url,
      {
        method: "GET",

        cache: "no-store",

        headers: {
          "Cache-Control": "no-cache"
        }
      }
    );


  if (!resposta.ok) {

    throw new Error(
      "Erro ao consultar status.json. HTTP " +
      resposta.status
    );

  }


  const texto =
    await resposta.text();


  console.log(
    "STANG FILAS - JSON RECEBIDO:",
    texto
  );


  const dados =
    JSON.parse(texto);


  // Validação básica.
  if (
    typeof dados.carga_aberta !== "boolean" ||
    typeof dados.descarga_aberta !== "boolean"
  ) {

    throw new Error(
      "status.json recebido em formato inválido."
    );

  }


  return dados;
}
