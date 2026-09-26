# Controle remoto de filas do Totem Sispetro

Projeto para:
- controlar **Carga** e **Descarga** separadamente;
- encerrar ou reabrir ambas;
- operar de outro computador, em outra rede de internet;
- mostrar aviso chamativo somente na tela inicial do totem;
- esconder o aviso quando o cliente iniciar atendimento ou cadastrar biometria;
- voltar a mostrar o aviso quando retornar à tela inicial.

## Arquitetura

- **Streamlit Cloud**: painel administrativo público via HTTPS.
- **Supabase**: guarda o estado central (`carga_aberta` / `descarga_aberta`).
- **Extensão Chrome no totem**: consulta o Supabase a cada 3 segundos e desenha o aviso na página do Sispetro.

> O código não altera o Sispetro no servidor. A extensão apenas acrescenta um aviso visual no navegador do totem.

## 1. Criar projeto no Supabase

1. Crie uma conta/projeto gratuito no Supabase.
2. Abra **SQL Editor**.
3. Cole e execute `supabase.sql`.
4. Em **Project Settings > API**, copie:
   - Project URL
   - `anon` / publishable key
   - `service_role` key

**IMPORTANTE:** a `service_role` nunca deve ir para GitHub ou para a extensão.

## 2. Configurar a extensão

Abra `extension/content.js` e altere:

```js
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "COLE_AQUI_SUA_ANON_KEY";
```

Depois abra `extension/manifest.json` e troque:

```json
"https://SEU-PROJETO.supabase.co/*"
```

pela URL real do seu projeto.

A chave `anon` pode ficar na extensão porque ela terá apenas permissão de leitura, conforme a policy do `supabase.sql`.

## 3. Subir no GitHub

Crie um repositório e envie:

- `app.py`
- `requirements.txt`
- `.streamlit/config.toml`
- `supabase.sql`
- pasta `extension/`

Não envie nenhuma `service_role` key ou senha para o GitHub.

## 4. Publicar no Streamlit Community Cloud

1. Acesse Streamlit Community Cloud.
2. Conecte ao GitHub.
3. Escolha o repositório.
4. Main file: `app.py`.
5. Em **Settings > Secrets**, coloque:

```toml
SUPABASE_URL = "https://SEU-PROJETO.supabase.co"
SUPABASE_SERVICE_KEY = "SUA_SERVICE_ROLE_KEY"
ADMIN_PASSWORD = "SUA_SENHA_DO_PAINEL"
```

6. Faça o deploy.

O PC da Portaria poderá abrir a URL pública do Streamlit mesmo estando em outra rede.

## 5. Instalar a extensão no totem

1. No Chrome do totem, abra `chrome://extensions/`.
2. Ative **Modo do desenvolvedor**.
3. Clique **Carregar sem compactação**.
4. Selecione a pasta `extension`.
5. Abra novamente o Sispetro.

## 6. Funcionamento

Se Carga e Descarga estiverem abertas, nenhum aviso aparece.

Se fechar Carga, aparece na lateral esquerda:

`FILA DE CARGA ENCERRADA`

Se fechar Descarga:

`FILA DE DESCARGA ENCERRADA`

Se fechar ambas:

`FILAS DE CARGA E DESCARGA ENCERRADAS`

O aviso aparece apenas na tela inicial `/home/outros/modo_auto_atendimento`.

Ao clicar em **COMEÇAR ATENDIMENTO** ou **CADASTRAR BIOMETRIA FACIAL**, ele desaparece imediatamente. Ao voltar à tela inicial, reaparece se a fila continuar encerrada.

## Observação sobre novo dia

O código não mostra aviso antigo quando `data_referencia` não é a data atual. No primeiro uso do painel em um novo dia, clique em **REABRIR AMBAS** para registrar a data do dia e manter tudo aberto.

Se quiser automatizar a abertura diária em um horário fixo, isso pode ser acrescentado depois.
