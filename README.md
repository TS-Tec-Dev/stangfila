# Controle de Filas do Totem Sispetro — v2.1.0

Projeto para controlar remotamente as filas de **Carga** e **Descarga** e exibir aviso no totem.

## Novidades desta versão

- painel **sem tela de login**;
- tema cinza chumbo com branco;
- usa `logo.png` na raiz do projeto, quando o arquivo estiver presente;
- seleção do funcionário responsável antes de encerrar/reabrir uma fila;
- aba **Funcionários** para cadastrar e remover nomes;
- aba **Histórico** com registro de data, hora, funcionário e ação;
- aviso ativo também aparece no painel do Streamlit;
- texto pronto para WhatsApp, com botão para copiar;
- histórico pode ser baixado em CSV;
- extensão do Chrome continua exibindo o aviso somente na tela inicial do Sispetro.

## Arquivos do projeto

```text
stangfila/
├── app.py
├── logo.png                  # coloque seu logotipo aqui
├── status.json
├── funcionarios.json
├── historico.json
├── requirements.txt
├── runtime.txt
├── .streamlit/
│   └── config.toml
└── extension/
    ├── manifest.json
    ├── background.js
    ├── content.js
    ├── options.html
    └── options.js
```

## 1. Logo

Coloque seu arquivo `logo.png` na raiz do repositório, ao lado de `app.py`.

Se o arquivo não existir, o painel continua funcionando, mas mostra um aviso para adicioná-lo.

## 2. Secrets do Streamlit

Não existe mais `ADMIN_PASSWORD`.

Em **Manage app > Settings > Secrets**, use:

```toml
GITHUB_TOKEN = "SEU_TOKEN_COM_CONTENTS_READ_AND_WRITE"
GITHUB_OWNER = "TS-Tec-Dev"
GITHUB_REPO = "stangfila"
GITHUB_BRANCH = "main"
```

O token do Streamlit precisa ter no repositório `stangfila`:

```text
Contents -> Read and write
```

## 3. Funcionários

Abra a aba **Funcionários** no painel para cadastrar ou remover nomes.

Os nomes ficam salvos em `funcionarios.json` no GitHub.

Antes de encerrar ou reabrir uma fila, selecione o funcionário na aba **Controle de Filas**.

## 4. Histórico

Toda ação feita no painel é registrada em `historico.json`, incluindo:

- data;
- hora;
- funcionário;
- ação executada;
- situação final da Carga;
- situação final da Descarga.

O painel possui uma aba **Histórico** e permite baixar os registros em CSV.

## 5. Aviso para WhatsApp

Quando pelo menos uma fila estiver encerrada, o mesmo aviso aparece no painel Streamlit.

Logo abaixo existe um texto formatado para WhatsApp e o botão:

```text
📋 Copiar aviso para WhatsApp
```

## 6. Instalar a extensão no totem

1. Abra `chrome://extensions/`.
2. Ative **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `extension`.
5. A versão deve aparecer como `2.1.0`.
6. Abra **Detalhes > Opções da extensão**.
7. Informe um token GitHub separado, apenas de leitura.

Token do totem:

```text
Repository: stangfila
Contents: Read-only
```

Não use no totem o token de escrita do Streamlit.

## 7. Comportamento no Sispetro

- Carga e Descarga abertas: nenhum aviso.
- Carga encerrada: aviso lateral de Carga.
- Descarga encerrada: aviso lateral de Descarga.
- Ambas encerradas: aviso de atendimento encerrado.
- Ao clicar em **COMEÇAR ATENDIMENTO** ou **CADASTRAR BIOMETRIA FACIAL**, o aviso desaparece.
- Ao retornar para a tela inicial, ele volta se a fila continuar encerrada.

## Observação de segurança

Como foi solicitado, o painel Streamlit não possui login. Portanto, qualquer pessoa que conhecer a URL pública do painel poderá acessá-lo e, se o app estiver público, poderá alterar as filas. Restrinja a divulgação da URL ou volte a adicionar autenticação futuramente se necessário.
