const STATUS_URL =
  "https://raw.githubusercontent.com/TS-Tec-Dev/stangfila/main/status.json";


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

        console.error(
          "Erro ao buscar status:",
          erro
        );

        sendResponse({
          sucesso: false,
          erro: erro.toString()
        });

      });

    return true;
  }
);


async function buscarStatus() {

  const url =
    STATUS_URL +
    "?t=" +
    Date.now();

  const resposta = await fetch(
    url,
    {
      cache: "no-store"
    }
  );

  if (!resposta.ok) {

    throw new Error(
      "HTTP " + resposta.status
    );

  }

  return await resposta.json();
}
