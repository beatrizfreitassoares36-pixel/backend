# API de Gestão Comercial

## Objetivo e problema resolvido

Esta API fornece operações REST para o gerenciamento de uma loja: produtos, categorias, estoque, entradas e saídas, clientes, fornecedores, funcionários, pedidos e registros relacionados.

Ela resolve a fragmentação de informações e de tarefas operacionais ao centralizar cadastro, consulta e atualização dos dados comerciais em um backend integrado a um banco MySQL.

O repositório inclui o backend/API e uma interface web em `frontend/`. A interface usa os contratos REST documentados neste arquivo e, no modo de desenvolvimento, encaminha as chamadas à API pública hospedada.

## Funcionalidades da API

A API oferece suporte às principais operações de gestão de uma loja, incluindo:

- Cadastro e autenticação de usuários
- Gestão de funcionários, clientes e fornecedores
- Cadastro de categorias e produtos
- Controle de estoque com entradas e saídas
- Registro de movimentações do inventário
- Emissão e acompanhamento de pedidos e itens do pedido
- Histórico de preços por produto
- Registro de logs de ações realizadas no sistema
- Validação de dados, tratamento de erros e respostas em JSON

Além disso, a API segue uma estrutura REST com rotas dedicadas para cada módulo, permitindo fácil integração com frontend, apps mobile ou outros sistemas.

## Tecnologias do backend

- Node.js e Express 5: servidor HTTP e rotas REST.
- Sequelize 6 e `mysql2`: ORM e driver usados para mapear tabelas e persistir dados no MySQL.
- MySQL: banco relacional da aplicação.
- `jsonwebtoken`: emissão e validação de tokens JWT.
- `bcryptjs`: hash de senhas e verificação de credenciais.
- `dotenv`: leitura de variáveis de ambiente.
- `cors`: configuração de origens que podem chamar a API.
- Morgan: registro das requisições HTTP.

O Sequelize é usado para executar consultas e operações de persistência por modelos mapeados ao schema existente. Também permite executar operações atômicas em transações, como o registro de saídas de estoque. Os modelos não alteram o schema automaticamente.

## Executar

Requisitos: Node.js, npm e uma instância MySQL com o schema da aplicação já provisionado.

1. Clone o repositório, acesse a pasta do projeto e instale as dependências:

   ```bash
   git clone https://github.com/beatrizfreitassoares36-pixel/backend.git
   cd backend
   npm install
   ```

2. Crie um `.env` local na raiz. Use os nomes abaixo e preencha os valores apenas no seu ambiente:

   ```env
   PORT=5000
   DB_HOST=<host-do-mysql>
   DB_PORT=3306
   DB_USER=<usuario-do-mysql>
   DB_PASSWORD=<senha-do-mysql>
   DB_NAME=<nome-do-banco>
   JWT_SECRET=<segredo-aleatorio-forte>
   CORS_ORIGIN=<origem-autorizada>
   ```

   `DB_HOST`, `DB_USER`, `DB_NAME` e `JWT_SECRET` são necessários. Informe `DB_PASSWORD` quando o MySQL exigir senha. `PORT` é opcional (padrão `5000`); `DB_PORT` é opcional (padrão `3306`). `CORS_ORIGIN` é opcional. Para um frontend em outra origem, configure a origem exata, incluindo protocolo e porta quando houver, sem caminho ou barra final. Para várias origens, separe-as por vírgulas:

   ```env
   CORS_ORIGIN=http://localhost:5173,https://seu-frontend.example.com
   ```

   Sem `CORS_ORIGIN`, chamadas same-origin continuam funcionando e o servidor não concede acesso CORS a outros domínios. O middleware permite os métodos usados pela API e os cabeçalhos `Content-Type` e `Authorization`; não habilita credenciais/cookies. Origens configuradas que não sejam URLs HTTP/HTTPS válidas fazem a aplicação falhar na inicialização.

   Gere um `JWT_SECRET` forte localmente, por exemplo com `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. Nunca coloque valores reais de senha, tokens ou segredos neste README, no `.env.example` ou em arquivos públicos do GitHub. O `.env` está no `.gitignore`.

3. Confira a conexão com o banco:

   ```bash
   npm run db:check
   ```

4. Inicie a API:

   ```bash
   npm start
   ```

   Para desenvolvimento com reinicialização automática:

   ```bash
   npm run dev
   ```

A API valida a porta, autentica no MySQL e só então começa a escutar em `0.0.0.0`. Se as variáveis do banco estiverem ausentes, a conexão falhar ou a porta for inválida, a inicialização falha explicitamente sem abrir o servidor HTTP. O endereço local padrão é `http://localhost:5000`. Ao receber `SIGINT` ou `SIGTERM`, o servidor deixa de aceitar conexões e fecha o pool do banco. O projeto não executa `sequelize.sync()` nem cria/altera tabelas automaticamente; provisione o schema por meio de DDL/migrações revisadas e adequadas ao ambiente. Não publique dumps de banco ou dados reais.

### Preparar o banco de dados

O repositório não contém um script completo para criar todas as tabelas. A pasta `migrations/` inclui somente uma migração pontual, não o schema inteiro; o dump SQL de exemplo é local e está ignorado pelo Git. Antes de executar a API com dados reais, obtenha o DDL/schema completo de uma fonte autorizada (por exemplo, do administrador do banco) e provisione um banco MySQL compatível. Configure `DB_HOST` para aceitar conexões do ambiente da API e use uma conta de banco dedicada, com permissões mínimas de `SELECT`, `INSERT`, `UPDATE` e `DELETE` nas tabelas da aplicação; aplique alterações de schema com uma conta administrativa separada. Não envie dumps com dados ou senhas ao GitHub.

O comando `npm run db:check` confirma a autenticação e uma consulta `SELECT 1`; ele não verifica nem cria as tabelas da aplicação.

### Executar os testes automatizados

```bash
npm test
```

Os testes usam o runner nativo `node:test`, iniciam servidores HTTP locais temporários e simulam o modelo no teste de login. Eles cobrem saúde da API, validações, autorização e login, e não criam nem alteram registros no banco. A configuração do Sequelize exige que `DB_HOST`, `DB_USER` e `DB_NAME` estejam definidos ao carregar a aplicação; por isso, crie o `.env` antes de executar `npm test`. Os testes não abrem conexão com o MySQL; use `npm run db:check` separadamente para testar a conectividade real.

### Executar a interface frontend

A interface usa React e Vite e pode ser iniciada sem configurar um banco local. Por padrão, o servidor de desenvolvimento encaminha as chamadas REST para a API publicada `https://backend-1-puom.onrender.com`, evitando uma chamada cross-origin direta pelo navegador:

```bash
cd frontend
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite (normalmente `http://localhost:5173`). Entre com uma conta ativa provisionada no banco da aplicação. A interface cobre login, consulta e operações CRUD que cada rota oferece para usuários, funcionários, categorias, clientes, fornecedores, produtos, estoque, entradas, saídas, pedidos e itens, movimentações, histórico de preços e logs. O cadastro de usuários continua protegido por JWT: não existe inscrição pública ou conta inicial padrão, então a primeira conta precisa ser criada pelo responsável pelo banco em um processo administrativo seguro. O token de login é mantido somente na sessão atual do navegador e enviado no cabeçalho `Authorization: Bearer <JWT>`.

Para validar a versão de produção dos arquivos estáticos, execute `npm run build` dentro de `frontend/`; os arquivos gerados em `frontend/dist/` são servidos pelo backend na mesma origem. Se a interface for hospedada em uma origem diferente da API, defina `VITE_API_BASE_URL=https://backend-1-puom.onrender.com` durante o build e cadastre a origem exata do frontend na variável `CORS_ORIGIN` do serviço backend no Render. O proxy Vite é apenas para desenvolvimento e não é incluído no build de produção.

## Publicar no Render

O arquivo `render.yaml` configura um serviço Web Node no plano gratuito, instala as dependências, executa os testes, compila a interface em `frontend/dist/`, inicia a API com `npm start` e usa `GET /teste` como verificação de saúde. A interface compilada é servida pelo próprio backend na origem da API; assim, não requer CORS para esse acesso same-origin.

1. Envie este repositório ao GitHub e, no Render, crie um **Blueprint** conectado ao repositório que contém `render.yaml`.
2. No serviço, informe `DB_HOST`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` do MySQL hospedado. `DB_PORT` está definido como `3306`; altere-o no painel se o provedor usar outra porta. Garanta no provedor do MySQL que conexões do Render sejam permitidas e que a conta de aplicação tenha as permissões descritas acima.
3. Gere uma `JWT_SECRET` forte e configure-a como variável secreta no Render. Não coloque senhas ou segredos no repositório nem compartilhe o `.env`.
4. Se o frontend estiver hospedado em outra origem, configure `CORS_ORIGIN` no Render para essa origem exata; para várias origens, use uma lista separada por vírgulas. Se frontend e API usam o mesmo domínio, não é necessário habilitar CORS para esse acesso same-origin.
5. Se o provedor do MySQL exigir TLS, confirme e configure a compatibilidade antes de publicar; a configuração atual do pool não habilita TLS.
6. O serviço implantado está disponível em `https://backend-1-puom.onrender.com`. Verifique `GET https://backend-1-puom.onrender.com/teste`. O plano gratuito pode suspender o serviço quando estiver ocioso e causar demora na primeira requisição.

O serviço precisa ser conectado ao repositório no painel do Render para publicar e fazer deploy automático dos commits. Variáveis com `sync: false` são solicitadas/configuradas fora do YAML e não armazenam credenciais no Git.

## Publicar os arquivos estáticos no AlwaysData

O frontend React/Vite deve ser compilado antes do envio. Configure a URL da API durante o build, envie o conteúdo de `frontend/dist/` para `/home/<conta>/www/frontend-static/` por SFTP/SSH e configure o site do AlwaysData como **Static files**, com a raiz `www/frontend-static/`. Usar uma pasta dedicada como raiz evita servir arquivos PHP antigos que possam existir em `www/`.

Como o frontend estático e a API usam origens diferentes, configure `CORS_ORIGIN=https://beatrizfreitassoares.alwaysdata.net` nas variáveis do serviço backend no Render e aguarde o deploy. O frontend usa `VITE_API_BASE_URL=https://backend-1-puom.onrender.com`; valide que a página e os arquivos `/assets/` respondam com HTTP 200, que a preflight CORS retorne HTTP 204 e que `GET https://backend-1-puom.onrender.com/teste` retorne a mensagem de saúde da API.

### Endereço público

O serviço Render foi criado e sua URL pública foi verificada com sucesso:

- URL base: `https://backend-1-puom.onrender.com`
- Verificação de saúde: `https://backend-1-puom.onrender.com/teste`
- Login: `https://backend-1-puom.onrender.com/usuario/login`

## ORM e camada de dados

O projeto configura uma instância Sequelize 6 em `sequelize.js` e define os modelos das tabelas MySQL em `models/index.js`. As rotas usam o ORM para consultas, inserções, atualizações e exclusões; operações que exigem atomicidade, como registrar saídas e atualizar o estoque, usam transações Sequelize. O pool está limitado a 10 conexões e o logging SQL fica desativado.

Os modelos mapeiam as tabelas existentes e não sincronizam nem alteram o schema automaticamente. O repositório não fornece DDL completo para criação inicial das tabelas; obtenha e aplique o schema por um processo administrativo autorizado. Não execute `sync({ alter: true })` em produção.

Valide as credenciais e a conectividade com uma consulta somente de leitura:

```bash
npm run db:check
```

O comando tenta autenticar, executa `SELECT 1` e encerra a conexão sem modificar dados.

## Cadastro e autenticação

O endpoint de cadastro `POST /usuario` é protegido, assim como as demais rotas de dados. Portanto, para cadastrar usuários pela API, é necessário já possuir um token válido. O projeto não oferece uma rota pública nem um usuário inicial padrão: a primeira conta deve ser provisionada pelo responsável pelo banco em um processo administrativo seguro, armazenando a senha como hash bcrypt. Não remova a proteção da rota nem coloque credenciais no código ou em arquivos públicos.

1. Envie `POST /usuario` com JSON e um token administrativo já válido:

   ```bash
   curl -X POST http://localhost:5000/usuario \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <JWT>" \
     -d "{\"nome\":\"Novo usuário\",\"email\":\"usuario@example.com\",\"senha\":\"<senha-forte>\"}"
   ```

   Campos obrigatórios: `nome`, `email` válido e `senha` com pelo menos 8 caracteres. `contato` e `genero` são opcionais. A API armazena a senha usando bcrypt e responde com `201 Created` e `id_usuario`, sem retornar a senha.

2. Autentique o usuário com `POST /usuario/login` (não requer token):

   ```bash
   curl -X POST http://localhost:5000/usuario/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"usuario@example.com\",\"senha\":\"<senha-informada-no-cadastro>\"}"
   ```

   Em caso de sucesso, a resposta `200 OK` tem a forma abaixo:

   ```json
   {
     "mensagem": "Login realizado com sucesso.",
     "token": "<JWT>",
     "usuario": {
       "id_usuario": 1,
       "nome": "Novo usuário",
       "email": "usuario@example.com"
     }
   }
   ```

   Envie o token nas rotas protegidas usando `Authorization: Bearer <JWT>`. O token expira em 8 horas. Login inválido retorna `401`; JSON/credenciais malformados retornam `400`. A implementação valida assinatura e expiração do token, mas não possui papéis/permissões por usuário: qualquer conta autenticada pode chamar as rotas protegidas.

## Formato das requisições e respostas

Os endpoints recebem corpos JSON (`Content-Type: application/json`). Campos e exemplos específicos por operação estão nas tabelas de endpoints abaixo. Datas de calendário usam `YYYY-MM-DD`; IDs são inteiros positivos. Respostas de criação normalmente incluem `mensagem` e o identificador gerado; consultas de listas e registros usam as propriedades indicadas nas tabelas. Senhas não são devolvidas pelas rotas de usuário.

## Convenções

- Os caminhos abaixo são relativos à origem da API; não há prefixo `/api`.
- Os corpos das requisições devem ser enviados em JSON (`Content-Type: application/json`).
- Datas de calendário aceitas nos campos correspondentes usam `YYYY-MM-DD`.
- IDs devem ser inteiros positivos.
- Listas são retornadas dentro de uma propriedade com o nome indicado na tabela; consultas por ID retornam o objeto correspondente. As respostas também podem conter `mensagem`.
- Campos não indicados para `PATCH` não são atualizados. Campos omitidos em `PATCH` permanecem inalterados; alguns campos opcionais aceitam `null`, conforme descrito abaixo.
- Não há paginação ou filtros de listagem. `POST /usuario/login` e `GET /teste` são públicos; todas as demais rotas exigem `Authorization: Bearer <JWT>` com um JWT válido emitido pelo login.
- Erros de validação retornam HTTP `400`; registros ausentes, `404`; conflitos, `409`; erros internos, `500`. Em geral, as rotas retornam `{ "mensagem": "..." }`. Erros tratados pelo middleware global retornam `{ "erro": { "mensagem": "..." } }`.

## Verificação

`GET /teste` retorna HTTP `200` e `{ "mensagem": "Tudo OK" }`.

Teste o serviço publicado:

```bash
curl -i https://backend-1-puom.onrender.com/teste
```

Para testar localmente, use `http://localhost:5000/teste`.

## Endpoints

### Usuários — `/usuario`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `POST /usuario/login` | Autentica um usuário ativo. | Obrigatórios: `email` válido e `senha`. Retorna `token` JWT válido por 8 horas e os campos públicos do usuário (`id_usuario`, `nome`, `email`). Credenciais inválidas retornam `401`; dados inválidos, `400`; `JWT_SECRET` ausente, `500`. |
| `GET /usuario` | Lista usuários ativos. | Resposta: `{ "usuarios": [...] }`; a senha nunca é retornada. |
| `GET /usuario/:id` | Busca usuário ativo pelo ID. | Resposta: `{ "usuario": {...} }`. |
| `POST /usuario` | Cadastra usuário. | Obrigatórios: `nome`, `email`, `senha` (mínimo 8 caracteres). Opcionais: `contato`, `genero` (texto ou `null`). A senha é armazenada como hash. Retorna `id_usuario`. |
| `PATCH /usuario/:id` | Atualiza usuário ativo. | Aceita `nome`, `email`, `senha`, `contato`, `genero`. A senha, se enviada, também precisa ter ao menos 8 caracteres e é armazenada como hash. |
| `DELETE /usuario/:id` | Desativa usuário (exclusão lógica). | — |

Envie `Authorization: Bearer <JWT>` nas chamadas às demais rotas.

### Funcionários — `/funcionario`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /funcionario` | Lista funcionários ativos. | Resposta: `{ "funcionarios": [...] }`. |
| `GET /funcionario/:id` | Busca funcionário ativo pelo ID. | Resposta: `{ "funcionario": {...} }`. |
| `POST /funcionario` | Cadastra funcionário. | Obrigatórios: `nome`, `cargo`, `salario` (número maior ou igual a zero). Opcionais: `telefone`, `email` (texto ou `null`), `data_admissao` (data válida `YYYY-MM-DD` ou `null`). Retorna `id_funcionario`. |
| `PATCH /funcionario/:id` | Atualiza funcionário ativo. | Aceita `nome`, `cargo`, `salario`, `telefone`, `email`, `data_admissao`. |
| `DELETE /funcionario/:id` | Desativa funcionário (exclusão lógica). | — |

### Categorias — `/categorias`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /categorias` | Lista categorias ativas. | Resposta: `{ "categorias": [...] }`. |
| `GET /categorias/:id` | Busca categoria ativa pelo ID. | Resposta: `{ "categoria": {...} }`. |
| `POST /categorias` | Cadastra categoria. | Obrigatório: `nome`. Opcional: `descricao` (texto ou `null`). Retorna `id_categoria`. |
| `PATCH /categorias/:id` | Atualiza categoria ativa. | Aceita `nome`, `descricao`. É necessário enviar ao menos um campo. |
| `DELETE /categorias/:id` | Desativa categoria (exclusão lógica). | — |

### Clientes — `/clientes`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /clientes` | Lista clientes ativos. | Resposta: `{ "clientes": [...] }`. |
| `GET /clientes/:id` | Busca cliente ativo pelo ID. | Resposta: `{ "cliente": {...} }`. |
| `POST /clientes` | Cadastra cliente. | Obrigatórios: `nome`, `email` válido. Opcional: `contato` (texto ou `null`). O email é armazenado em minúsculas. Retorna `id_cliente`; email duplicado retorna `409`. |
| `PATCH /clientes/:id` | Atualiza cliente ativo. | Aceita `nome`, `email`, `contato`. |
| `DELETE /clientes/:id` | Desativa cliente (exclusão lógica). | — |

### Fornecedores — `/fornecedores`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /fornecedores` | Lista fornecedores ativos. | Resposta: `{ "fornecedores": [...] }`. |
| `GET /fornecedores/:id` | Busca fornecedor ativo pelo ID. | Resposta: `{ "fornecedor": {...} }`. |
| `POST /fornecedores` | Cadastra fornecedor. | Obrigatório: `nome`. Opcionais: `empresa`, `email`, `telefone`, `cidade`, `estado` (textos ou `null`). Se informado, o email deve ser válido. Retorna `id_fornecedor`. |
| `PATCH /fornecedores/:id` | Atualiza fornecedor ativo. | Aceita `nome`, `empresa`, `email`, `telefone`, `cidade`, `estado`. |
| `DELETE /fornecedores/:id` | Desativa fornecedor (exclusão lógica). | — |

### Produtos — `/produtos`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /produtos` | Lista produtos. | Resposta: `{ "produtos": [...] }`. |
| `GET /produtos/:id` | Busca produto pelo ID. | Resposta: `{ "produto": {...} }`. |
| `POST /produtos` | Cadastra produto. | Obrigatórios: `nome`, `preco` (número maior ou igual a zero). Opcionais: `descricao` (padrão `""`), `imagem_produto` (padrão `""`), `id_categoria` (ID ou `null`). Categoria inexistente retorna `400`. Retorna `id_produto`. |
| `PATCH /produtos/:id` | Atualiza produto. | Aceita `nome`, `descricao`, `preco`, `imagem_produto`, `id_categoria`. Para `descricao` e `imagem_produto`, `null` é convertido em texto vazio; para `id_categoria`, `null` remove a associação. |
| `DELETE /produtos/:id` | Exclui produto. | Retorna `409` se houver registros relacionados. |

### Entradas de estoque — `/entradas`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /entradas` | Lista entradas da mais recente para a mais antiga. | Resposta: `{ "entradas": [...] }`. |
| `GET /entradas/:id` | Busca entrada pelo ID. | Resposta: `{ "entrada": {...} }`. |
| `POST /entradas` | Registra entrada. | Obrigatórios: `id_produto`, `id_fornecedor`, `quantidade` (inteiro maior que zero), `valor_unitario` (número não negativo). Opcionais: `data_entrada` (`YYYY-MM-DD`), `observacao` (texto ou `null`). Retorna `id_entrada`. |

### Saídas de estoque — `/saidas`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /saidas` | Lista saídas da mais recente para a mais antiga. | Resposta: `{ "saidas": [...] }`. |
| `GET /saidas/:id` | Busca saída pelo ID. | Resposta: `{ "saida": {...} }`. |
| `POST /saidas` | Registra saída; verifica o estoque em uma transação e retorna `409` se a quantidade disponível for insuficiente. | Obrigatórios: `id_produto`, `id_funcionario`, `quantidade` (inteiro maior que zero), `valor_unitario` (número não negativo). Opcionais: `data_saida` (`YYYY-MM-DD` ou `null`), `destino` (texto ou `null`). Retorna `id_saida`. |

### Estoque — `/estoque`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /estoque` | Lista estoque, incluindo o nome do produto. | Resposta: `{ "estoque": [...] }`. |
| `GET /estoque/:id` | Busca o estoque pelo ID do produto. | Resposta: `{ "item": {...} }`. |
| `PATCH /estoque/:id` | Atualiza limites ou localização do estoque do produto. | Aceita ao menos um de `estoque_minimo`, `estoque_maximo` (inteiro não negativo ou `null`) e `localizacao` (texto ou `null`). A quantidade atual não pode ser alterada por esta rota. |

### Pedidos — `/pedidos`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /pedidos` | Lista pedidos, incluindo nome do cliente quando associado. | Resposta: `{ "pedidos": [...] }`. |
| `GET /pedidos/:id` | Busca pedido e seus itens. | Resposta: `{ "pedido": { ..., "itens": [...] } }`. |
| `POST /pedidos` | Cria pedido. | Opcionais: `status` (`0`, `1`, `false` ou `true`; padrão `1`), `data_pedido` (`YYYY-MM-DD` ou `null`), `id_cliente` (ID ou `null`). Retorna `id_pedido`. |
| `PATCH /pedidos/:id` | Atualiza pedido. | Aceita `status`, `data_pedido`, `id_cliente`. |

### Itens de pedido — `/pedido-itens`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /pedido-itens` | Lista itens dos pedidos. | Resposta: `{ "itens": [...] }`. |
| `GET /pedido-itens/:id` | Busca item pelo ID. | Resposta: `{ "item": {...} }`. |
| `POST /pedido-itens` | Adiciona item a pedido e calcula o subtotal. | Obrigatórios: `id_pedido`, `id_produto`, `quantidade` (inteiro maior que zero), `valor_unitario` (número não negativo). Retorna `id_item` e `subtotal`. |
| `PATCH /pedido-itens/:id` | Atualiza quantidade e/ou valor unitário e recalcula subtotal. | Aceita `quantidade`, `valor_unitario`. |
| `DELETE /pedido-itens/:id` | Remove item do pedido. | — |

### Movimentações — `/movimentacoes`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /movimentacoes` | Lista movimentações. | Resposta: `{ "movimentacoes": [...] }`. |
| `GET /movimentacoes/:id` | Busca movimentação pelo ID. | Resposta: `{ "movimentacao": {...} }`. |
| `POST /movimentacoes` | Registra movimentação. | Campos opcionais: `id_produto` (ID ou `null`), `tipo` (`E`, `S`, `A`, `P` ou `T`), `quantidade` (inteiro não negativo ou `null`), `data_movimentacao` (data reconhecida pelo JavaScript ou `null`), `observacao` (texto ou `null`). |

### Histórico de preços — `/historico-precos`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /historico-precos` | Lista histórico por vigência decrescente. | Resposta: `{ "historico": [...] }`. |
| `GET /historico-precos/:id` | Busca registro pelo ID. | Resposta: `{ "registro": {...} }`. |
| `POST /historico-precos` | Registra preço para produto. | Obrigatórios: `id_produto`, `preco` (número não negativo). Opcional: `vigencia` (`YYYY-MM-DD` ou `null`). Retorna `id_historico`. |

### Logs — `/logs`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /logs` | Lista logs do mais recente para o mais antigo. | Resposta: `{ "logs": [...] }`. |
| `GET /logs/:id` | Busca log pelo ID. | Resposta: `{ "log": {...} }`. |
| `POST /logs` | Registra log. | Opcionais: `usuario`, `tabela_afetada`, `acao` (textos ou `null`), `registro` (ID ou `null`), `data_hora` (data/hora reconhecida pelo JavaScript ou `null`). Retorna `id_log`. |

## Exemplo

```bash
curl -X POST http://localhost:5000/categorias \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"Bebidas\",\"descricao\":\"Bebidas e sucos\"}"
```

Exemplo de resposta (`201 Created`; substitua `<JWT>` por um token válido):

```json
{
  "mensagem": "Categoria cadastrada com sucesso.",
  "id_categoria": 1
}
```
