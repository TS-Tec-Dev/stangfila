# Controle de Filas do Totem Sispetro

Projeto para controlar remotamente as filas de **Carga** e **Descarga** do totem, mesmo quando o PC da Portaria e o totem estão em redes diferentes.

## Arquitetura

- **Streamlit Cloud**: painel administrativo.
- **GitHub**: armazena o arquivo `status.json` com o estado atual das filas.
- **Extensão Chrome**: consulta o `status.json` pela API do GitHub e mostra o aviso na tela inicial do Sispetro.

Não há dependência de Supabase.

## Estrutura

```text
stangfila/
├── .streamlit/
│   └── config.toml
├── extension/
│   ├── background.js
│   ├── content.js
│   ├── manifest.json
│   ├── options.html
│   └── options.js
├── .gitignore
├── app.py
├── README.md
├── requirements.txt
├── runtime.txt
└── status.json
```

## 1. GitHub

Substitua o conteúdo do repositório pelos arquivos deste pacote.

O `status.json` deve permanecer no repositório porque ele é o estado compartilhado entre o painel e o totem.

## 2. Token do Streamlit

Crie um Fine-grained Personal Access Token para o repositório `stangfila` com:

- Repository access: somente `stangfila`
- Contents: **Read and write**

Esse token fica somente nos Secrets do Streamlit.

## 3. Secrets do Streamlit

No Streamlit Community Cloud, abra **Manage app > Settings > Secrets** e configure:

```toml
ADMIN_PASSWORD = "SUA_SENHA_DO_PAINEL"
GITHUB_OWNER = "TS-Tec-Dev"
GITHUB_REPO = "stangfila"
GITHUB_BRANCH = "main"
GITHUB_TOKEN = "SEU_TOKEN_COM_READ_AND_WRITE"
```

Não coloque esse token dentro do repositório.

## 4. Token do totem

Crie um segundo Fine-grained Personal Access Token para o mesmo repositório com:

- Repository access: somente `stangfila`
- Contents: **Read-only**

Esse token **não deve ser colocado no GitHub**.

Ele será salvo localmente no Chrome do totem pela tela de opções da extensão.

## 5. Instalar a extensão

No PC do totem:

1. Abra `chrome://extensions/`.
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `extension`.
5. Confirme que aparece a versão **2.0.0**.
6. Clique em **Detalhes** da extensão.
7. Abra **Opções da extensão**.
8. Cole o token GitHub somente leitura.
9. Deixe:
   - Owner: `TS-Tec-Dev`
   - Repositório: `stangfila`
   - Branch: `main`
10. Clique em **Salvar configuração**.
11. Clique em **Testar conexão**.

O resultado esperado é algo como:

```text
Conexão OK.
Carga: ABERTA
Descarga: ABERTA
Data: 2026-09-28
```

## 6. Comportamento do aviso

- Carga aberta + Descarga aberta: nenhum aviso.
- Carga encerrada: mostra `FILA DE CARGA ENCERRADA`.
- Descarga encerrada: mostra `FILA DE DESCARGA ENCERRADA`.
- Ambas encerradas: mostra `FILAS DE CARGA E DESCARGA ENCERRADAS`.

O aviso aparece somente quando a página contém os elementos da tela inicial do Sispetro:

- `INÍCIO`
- `COMEÇAR ATENDIMENTO`
- `CADASTRAR BIOMETRIA FACIAL`

Por isso ele não depende de uma URL específica do Sispetro.

## 7. Atendimento e biometria

Ao clicar especificamente em **COMEÇAR ATENDIMENTO** ou **CADASTRAR BIOMETRIA FACIAL**, o aviso desaparece imediatamente.

Se o atendimento abrir outra aba, ao voltar para a aba inicial do totem o aviso reaparece se a fila ainda estiver encerrada.

Se a navegação ocorrer na mesma aba, o aviso reaparece quando a extensão detectar o retorno à tela inicial.

## 8. Atualização

A extensão consulta o status aproximadamente a cada **5 segundos**.

Quando o operador altera a fila no Streamlit, não é necessário baixar a extensão novamente.

Só é necessário atualizar/recarregar a extensão quando os arquivos dentro de `extension/` forem modificados.

## 9. Novo dia

Na primeira abertura do painel Streamlit em um novo dia, o sistema abre automaticamente as duas filas e atualiza `data_referencia` para a data atual.

## Segurança

- Token do Streamlit: **Read and write**, somente nos Secrets do Streamlit.
- Token do totem: **Read-only**, salvo somente no Chrome do totem.
- Nunca publique nenhum dos tokens no GitHub.
