const STATUS_URL =
  "https://raw.githubusercontent.com/TS-Tec-Dev/stangfila/main/status.json";


// ============================================================
// RECEBE PEDIDO DO CONTENT.JS
// ============================================================

chrome.runtime.onMessage.addconst GITHUB_TOKEN = "const GITHUB_TOKEN = "const GITHUB_TOKEN = "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";
const API_URL =
  "https://api.github.com/repos/TS-Tec-Dev/stangfila/contents/status.json?ref=main";

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

    return true;
  }
);


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

        "Accept":
          "application/vnd.github+json",

        "Authorization":
          "Bearer " + GITHUB_TOKEN,

        "X-GitHub-Api-Version":
          "2022-11-28",

        "Cache-Control":
          "no-cache"
      }
    }
  );


  if (!resposta.ok) {

    const erroTexto =
      await resposta.text();

    throw new Error(
      "GitHub HTTP " +
      resposta.status +
      " - " +
      erroTexto
    );

  }


  const arquivo =
    await resposta.json();


  if (!arquivo.content) {

    throw new Error(
      "O GitHub não retornou o conteúdo do status.json."
    );

  }


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
      function (c) {
        return c.charCodeAt(0);
      }
    );


  const texto =
    new TextDecoder(
      "utf-8"
    ).decode(bytes);


  const dados =
    JSON.parse(texto);


  if (
    typeof dados.carga_aberta !== "boolean" ||
    typeof dados.descarga_aberta !== "boolean"
  ) {

    throw new Error(
      "Formato inválido no status.json."
    );

  }


  console.log(
    "==============================="
  );

  console.log(
    "CARGA:",
    dados.carga_aberta
      ? "ABERTA"
      : "ENCERRADA"
  );

  console.log(
    "DESCARGA:",
    dados.descarga_aberta
      ? "ABERTA"
      : "ENCERRADA"
  );

  console.log(
    "ATUALIZADO EM:",
    dados.atualizado_em
  );

  console.log(
    "==============================="
  );


  return dados;
}";

const API_URL =
  "https://api.github.com/repos/TS-Tec-Dev/stangfila/contents/status.json?ref=main";

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

    return true;
  }
);


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

        "Accept":
          "application/vnd.github+json",

        "Authorization":
          "Bearer " + GITHUB_TOKEN,

        "X-GitHub-Api-Version":
          "2022-11-28",

        "Cache-Control":
          "no-cache"
      }
    }
  );


  if (!resposta.ok) {

    const erroTexto =
      await resposta.text();

    throw new Error(
      "GitHub HTTP " +
      resposta.status +
      " - " +
      erroTexto
    );

  }


  const arquivo =
    await resposta.json();


  if (!arquivo.content) {

    throw new Error(
      "O GitHub não retornou o conteúdo do status.json."
    );

  }


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
      function (c) {
        return c.charCodeAt(0);
      }
    );


  const texto =
    new TextDecoder(
      "utf-8"
    ).decode(bytes);


  const dados =
    JSON.parse(texto);


  if (
    typeof dados.carga_aberta !== "boolean" ||
    typeof dados.descarga_aberta !== "boolean"
  ) {

    throw new Error(
      "Formato inválido no status.json."
    );

  }


  console.log(
    "==============================="
  );

  console.log(
    "CARGA:",
    dados.carga_aberta
      ? "ABERTA"
      : "ENCERRADA"
  );

  console.log(
    "DESCARGA:",
    dados.descarga_aberta
      ? "ABERTA"
      : "ENCERRADA"
  );

  console.log(
    "ATUALIZADO EM:",
    dados.atualizado_em
  );

  console.log(
    "==============================="
  );


  return dados;
}";

const API_URL =
  "https://api.github.com/repos/TS-Tec-Dev/stangfila/contents/status.json?ref=main";

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

    return true;
  }
);


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

        "Accept":
          "application/vnd.github+json",

        "Authorization":
          "Bearer " + GITHUB_TOKEN,

        "X-GitHub-Api-Version":
          "2022-11-28",

        "Cache-Control":
          "no-cache"
      }
    }
  );


  if (!resposta.ok) {

    const erroTexto =
      await resposta.text();

    throw new Error(
      "GitHub HTTP " +
      resposta.status +
      " - " +
      erroTexto
    );

  }


  const arquivo =
    await resposta.json();


  if (!arquivo.content) {

    throw new Error(
      "O GitHub não retornou o conteúdo do status.json."
    );

  }


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
      function (c) {
        return c.charCodeAt(0);
      }
    );


  const texto =
    new TextDecoder(
      "utf-8"
    ).decode(bytes);


  const dados =
    JSON.parse(texto);


  if (
    typeof dados.carga_aberta !== "boolean" ||
    typeof dados.descarga_aberta !== "boolean"
  ) {

    throw new Error(
      "Formato inválido no status.json."
    );

  }


  console.log(
    "==============================="
  );

  console.log(
    "CARGA:",
    dados.carga_aberta
      ? "ABERTA"
      : "ENCERRADA"
  );

  console.log(
    "DESCARGA:",
    dados.descarga_aberta
      ? "ABERTA"
      : "ENCERRADA"
  );

  console.log(
    "ATUALIZADO EM:",
    dados.atualizado_em
  );

  console.log(
    "==============================="
  );


  return dados;
}Listener(
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
