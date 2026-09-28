const token = document.getElementById("token");
const owner = document.getElementById("owner");
const repo = document.getElementById("repo");
const branch = document.getElementById("branch");
const msg = document.getElementById("msg");

function mostrar(texto, tipo) {
  msg.className = tipo;
  msg.textContent = texto;
}

async function carregar() {
  const dados = await chrome.storage.local.get({
    token: "",
    owner: "TS-Tec-Dev",
    repo: "stangfila",
    branch: "main"
  });
  token.value = dados.token || "";
  owner.value = dados.owner || "TS-Tec-Dev";
  repo.value = dados.repo || "stangfila";
  branch.value = dados.branch || "main";
}

async function salvar() {
  await chrome.storage.local.set({
    token: token.value.trim(),
    owner: owner.value.trim() || "TS-Tec-Dev",
    repo: repo.value.trim() || "stangfila",
    branch: branch.value.trim() || "main"
  });
  mostrar("Configuração salva neste Chrome.", "ok");
}

document.getElementById("salvar").addEventListener("click", salvar);

document.getElementById("testar").addEventListener("click", async () => {
  await salvar();
  mostrar("Testando conexão...", "ok");

  chrome.runtime.sendMessage({ tipo: "TESTAR_CONFIG" }, (resposta) => {
    if (chrome.runtime.lastError) {
      mostrar("Erro de comunicação: " + chrome.runtime.lastError.message, "erro");
      return;
    }

    if (!resposta?.sucesso) {
      mostrar("Falha: " + (resposta?.erro || "erro desconhecido"), "erro");
      return;
    }

    const d = resposta.dados;
    mostrar(
      `Conexão OK.\nCarga: ${d.carga_aberta ? "ABERTA" : "ENCERRADA"}\nDescarga: ${d.descarga_aberta ? "ABERTA" : "ENCERRADA"}\nData: ${d.data_referencia || "-"}`,
      "ok"
    );
  });
});

carregar();
