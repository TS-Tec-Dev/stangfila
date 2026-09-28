sábado 15:48
agr não atualizou o do pc  para atualizar a extensão
deu este erro
oq pode ter acontecido pq no gihub esta true true porem esta lendo false e true

Posso refazer, mas não vou repetir nem embutir esse token aqui porque ele ficou exposto na conversa. Como ele já foi compartilhado, o mais seguro é revogar esse token no GitHub e criar outro, de preferência com acesso somente de leitura ao repositório stangfila.

Depois use o novo token apenas no background.js.

Substitua todo o background.js por este:

const GITHUB_TOKEN = "COLE_AQUI_O_NOVO_TOKEN_DE_LEITURA";

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
}

No manifest.json, deixe assim:

{
  "manifest_version": 3,

  "name": "Stang - Controle de Filas do Totem",

  "version": "1.6.0",

  "description": "Exibe no totem o status das filas de carga e descarga.",

  "background": {
    "service_worker": "background.js"
  },

  "content_scripts": [
    {
      "matches": [
        "https://app.sispetro.com.br/*"
      ],
      "js": [
        "content.js"
      ],
      "run_at": "document_idle"
    }
  ],

  "host_permissions": [
    "https://api.github.com/*"
  ]
}

E no seu content.js, pode diminuir o intervalo para 5 segundos:

setInterval(
  consultarStatus,
  5000
);

Assim o fluxo fica:

Streamlit
   ↓
GitHub status.json
   ↓
GitHub API autenticada
   ↓
background.js
   ↓
content.js
   ↓
TOTEM

A vantagem é que agora você não depende mais do cache do raw.githubusercontent.com, e o GitHub tende a responder com o estado mais atual do arquivo.

Antes de testar, recomendo revogar o token que você enviou e criar outro em:

GitHub
→ Settings
→ Developer settings
→ Personal access tokens
→ Fine-grained tokens

Permissões:

Repository:
stangfila

Contents:
Read-only

Depois coloque o novo token somente nesta linha local do background.js:

const GITHUB_TOKEN = "SEU_TOKEN";

Depois recarregue a extensão no Chrome.

hoje 14:08
esta aparecendo este erro

Sim. Esse erro agora é erro de sintaxe no background.js:

Uncaught SyntaxError: Unexpected identifier 'GITHUB_TOKEN'

O mais provável é que o token tenha sido colocado sem aspas, com alguma quebra de linha, ou tenha ficado texto sobrando antes de GITHUB_TOKEN. O Service worker registration failed. Status code: 15 é consequência disso.

Substitua todo o conteúdo do background.js por este código:

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
Atenção ao colocar o token

Tem que ficar exatamente assim, entre aspas e em uma única linha:

const GITHUB_TOKEN = "SEU_TOKEN_AQUI";

Não assim:

const GITHUB_TOKEN = SEU_TOKEN_AQUI;

Nem assim:

const GITHUB_TOKEN =
SEU_TOKEN_AQUI;

Depois salve o background.js.

Como sua extensão está instalada a partir de uma pasta local, modificar apenas o GitHub não altera automaticamente a pasta do totem. Portanto, atualize também o background.js dentro da pasta que o Chrome está usando.

Depois abra:

chrome://extensions/

e clique no botão circular ↻ Recarregar da extensão.

O erro:

Service worker registration failed

deve desaparecer.

Depois clique em:

service worker → Console

e o resultado esperado será algo assim:

STANG FILAS - STATUS RECEBIDO:
{carga_aberta: true, descarga_aberta: true, ...}

========================================
STANG FILAS - STATUS ATUAL
Carga: ABERTA
Descarga: ABERTA
========================================

Se o GitHub estiver em true / true, o aviso lateral deve desaparecer.

Um ponto de segurança: como o token anterior foi colocado na conversa, recomendo revogá-lo e gerar outro Read-only / Contents para usar nesta extensão. Não precisa me enviar o novo token.

agr deu esse erro 

Agora o erro ficou bem específico. O GitHub está recusando a requisição por causa deste cabeçalho que colocamos:

Cache-Control: no-cache

O próprio erro diz:

Request header field cache-control is not allowed

Então vamos remover completamente Cache-Control e também cache: "no-store". Para evitar cache, continuaremos usando o número aleatório/data na própria URL.

Substitua todo o background.js por este:

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

No seu manifest.json, confirme que está assim:

{
  "manifest_version": 3,

  "name": "Stang - Controle de Filas do Totem",

  "version": "1.6.1",

  "description": "Exibe no totem o status das filas de carga e descarga.",

  "background": {
    "service_worker": "background.js"
  },

  "content_scripts": [
    {
      "matches": [
        "https://app.sispetro.com.br/*"
      ],
      "js": [
        "content.js"
      ],
      "run_at": "document_idle"
    }
  ],

  "host_permissions": [
    "https://api.github.com/*"
  ]
}

No content.js, pode continuar consultando a cada 5 segundos:

setInterval(
  con
