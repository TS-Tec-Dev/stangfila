const API_URL =
  "https://api.github.com/repos/TS-Tec-Dev/stangfila/contents/status.json?ref=main";

chrome.runtime.onMessage.addListener(
  (mensagem, sender, sendResponse) => {

    if (mensagem.tipo !== "BUSCAR_STATUS") {
      return;
    }

    buscarStatus()
      .then((dados) => {
        sendResponse({
          sucesso: true,
          dados: dados
        });
      })
      .catch((erro) => {
        console.error("STANG FILAS:", erro);

        sendResponse({
          sucesso: false,
          erro: String(erro)
        });
      });

    return true;
  }
);


async function buscarStatus() {

  const resposta = await fetch(
    API_URL + "&t=" + Date.now(),
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Accept": "application/vnd.github+json"
      }
    }
  );

  if (!resposta.ok) {
    throw new Error(
      "GitHub respondeu HTTP " +
      resposta.status
    );
  }

  const arquivo = await resposta.json();

  if (!arquivo.content) {
    throw new Error(
      "status.json sem conteúdo"
    );
  }

  // O GitHub devolve o arquivo em Base64.
  const base64 =
    arquivo.content.replace(/\n/g, "");

  const texto =
    decodeURIComponent(
      escape(atob(base64))
    );

  const dados =
    JSON.parse(texto);

  console.log(
    "STANG FILAS - STATUS RECEBIDO:",
    dados
  );

  return dados;
}
