# API de Gerenciamento de Loja

## Nome, objetivo e problema resolvido

**API de Gerenciamento de Loja** centraliza as operações de uma loja em endpoints REST: usuários, funcionários, clientes, fornecedores, categorias, produtos, estoque, entradas e saídas, pedidos, movimentações, histórico de preços e logs.

Ela resolve a fragmentação de registros e o controle manual dessas atividades, oferecendo uma interface única para cadastrar, consultar, atualizar e, quando disponível, remover dados, além de manter o estoque atualizado e proteger as operações por autenticação.

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

## Tecnologias

- Node.js e Express 5 para o servidor HTTP e as rotas REST.
- Sequelize 6 como ORM: mapeia as tabelas MySQL a modelos e executa operações de persistência; transações são usadas em operações que precisam de atomicidade.
- MySQL como banco de dados, acessado pelo driver `mysql2`.
- `jsonwebtoken` para emitir e validar tokens JWT; `bcryptjs` para armazenar senhas como hashes e verificá-las no login.
- `dotenv` para carregar configuração local e `cors` para configurar origens permitidas.

## Executar

Requisitos: Node.js, npm e um servidor MySQL com o esquema da aplicação já criado. Os modelos em `models/index.js` mapeiam o schema existente; o servidor não cria nem altera tabelas automaticamente. O schema deve ser provisionado e administrado no seu ambiente.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure um arquivo `.env` na raiz:

   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=<usuario-do-banco>
   DB_PASSWORD=<senha-do-banco>
   DB_NAME=<nome-do-banco>
   JWT_SECRET=<segredo-aleatorio-forte>
   CORS_ORIGIN=http://localhost:5173
   ```

   `DB_HOST`, `DB_USER`, `DB_NAME` e `JWT_SECRET` são obrigatórias. `DB_PASSWORD` deve conter a senha do banco quando aplicável. `PORT` e `DB_PORT` são opcionais (padrões: `5000` e `3306`). `CORS_ORIGIN` é opcional; sem ela, a API permite qualquer origem. Para restringir ou permitir várias origens, informe uma origem ou uma lista separada por vírgulas.

   Gere `JWT_SECRET` com `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. Use valores reais somente em `.env` local ou no gerenciador de variáveis secretas do host. Não coloque senhas, tokens ou segredos em arquivos do Git.

3. (Opcional) valide a conexão Sequelize com o MySQL:

   ```bash
   npm run db:check
   ```

4. Inicie a aplicação:

   ```bash
   npm start
   ```

   Para desenvolvimento com reinicialização automática:

   ```bash
   npm run dev
   ```

A API escuta em `0.0.0.0`. O endereço local padrão é `http://localhost:5000`.

## Publicar no Render

O arquivo `render.yaml` configura um serviço Web Node no plano gratuito, instala apenas dependências de produção, inicia a API com `npm start` e usa `GET /teste` como verificação de saúde.

1. Envie este repositório ao GitHub e, no Render, crie um **Blueprint** conectado ao repositório que contém `render.yaml`.
2. No serviço, informe `DB_HOST`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` do MySQL hospedado. `DB_PORT` está definido como `3306`; altere-o no painel se o provedor usar outra porta.
3. Gere uma `JWT_SECRET` forte e configure-a como variável secreta no Render. Não coloque senhas ou segredos no repositório nem compartilhe o `.env`.
4. Se o banco restringir conexões por IP, permita as conexões de saída do Render conforme o plano e a documentação do provedor. Se o provedor do MySQL exigir TLS, confirme a compatibilidade antes de publicar; a configuração atual do pool não habilita TLS.
5. O build do Blueprint compila o frontend e o mesmo serviço entrega a interface e a API pela mesma origem. Depois de criar o serviço e concluir o deploy, copie o domínio público exibido pelo Render e atualize a seção [Endereço público](#endereço-público-da-api). Verifique `<URL-PUBLICA>/teste`; o plano gratuito pode suspender o serviço quando estiver ocioso e causar demora na primeira requisição.

O serviço precisa ser conectado ao repositório no painel do Render para publicar e fazer deploy automático dos commits. Variáveis com `sync: false` são solicitadas/configuradas fora do YAML e não armazenam credenciais no Git.

## Endereço público da API

O repositório contém a configuração para hospedagem no Render, mas não há um domínio público de produção registrado nesta documentação. O arquivo `render.yaml` não publica o serviço sozinho: é necessário criar o Blueprint no Render, configurar as variáveis secretas e concluir o deploy. Após a publicação, substitua este aviso pela URL real, por exemplo `https://<dominio-do-servico>.onrender.com`; a verificação de saúde ficará em `<URL-PUBLICA>/teste`.

## ORM e camada de dados

O projeto configura uma instância Sequelize 6 em `sequelize.js` e define os modelos MySQL em `models/index.js`. As rotas usam os modelos Sequelize para consultas, inserções, atualizações e exclusões; operações que exigem atomicidade, como registrar saídas e atualizar o estoque, usam transações Sequelize. O pool está limitado a 10 conexões e o logging SQL fica desativado.

Os modelos mapeiam as tabelas existentes e não sincronizam nem alteram o schema automaticamente. Provisione e atualize o schema conforme o DDL aprovado para seu ambiente; não execute `sync({ alter: true })` em produção.

Valide as credenciais e a conectividade com uma consulta somente de leitura:

```bash
npm run db:check
```

O comando tenta autenticar, executa `SELECT 1` e encerra a conexão sem modificar dados.

## Frontend

O painel React/Vite fica na pasta `frontend/` e consome os endpoints documentados acima.

1. Inicie o backend em um terminal, na raiz do repositório:

   ```bash
   npm install
   npm run dev
   ```

2. Em outro terminal, instale e inicie o frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Abra o endereço local mostrado pelo Vite (normalmente `http://localhost:5173`). Sem `VITE_API_URL`, o proxy de desenvolvimento encaminha as rotas da API para `http://localhost:5000`. Para outra URL, defina `VITE_API_URL` no ambiente de build do frontend; em hospedagem separada, permita a origem do frontend em `CORS_ORIGIN` no backend.

O frontend inclui login, dashboard e telas para operações disponíveis nos módulos. A API valida o JWT no servidor: somente `POST /usuario/login` e `GET /teste` são públicos; todas as demais rotas exigem autenticação.

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

## Endpoints

### Usuários — `/usuario`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `POST /usuario/login` | Autentica um usuário ativo. | Obrigatórios: `email` válido e `senha`. Retorna `token` JWT válido por 8 horas e os campos públicos do usuário (`id_usuario`, `nome`, `email`). Credenciais inválidas retornam `401`; dados inválidos, `400`; `JWT_SECRET` ausente, `500`. |
| `GET /usuario` | Lista usuários ativos. | Resposta: `{ "usuarios": [...] }`; a senha nunca é retornada. |
| `GET /usuario/:id` | Busca usuário ativo pelo ID. | Resposta: `{ "usuario": {...} }`. |
| `POST /usuario` | Cadastra usuário. Esta rota exige autenticação. | Obrigatórios: `nome`, `email`, `senha` (mínimo 8 caracteres). Opcionais: `contato`, `genero` (texto ou `null`). A senha é armazenada como hash bcrypt, nunca em texto puro. Retorna `id_usuario`. |
| `PATCH /usuario/:id` | Atualiza usuário ativo. | Aceita `nome`, `email`, `senha`, `contato`, `genero`. A senha, se enviada, também precisa ter ao menos 8 caracteres e é armazenada como hash. |
| `DELETE /usuario/:id` | Desativa usuário (exclusão lógica). | — |

Envie `Authorization: Bearer <token>` nas chamadas às demais rotas. O frontend armazena o token apenas na sessão atual do navegador e o inclui nas requisições automaticamente.

#### Cadastrar usuário e testar login

O cadastro de usuários é protegido. Portanto, o primeiro usuário ativo deve ser provisionado por um administrador usando um processo seguro de inicialização do banco, armazenando a senha como hash bcrypt; não há cadastro público aberto sem autenticação. Depois que houver um usuário ativo, autentique-se e use o token para cadastrar outros usuários.

Exemplo de cadastro (substitua os valores indicados e use um token válido):

```bash
curl -X POST http://localhost:5000/usuario \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT-VALIDO>" \
  -d '{"nome":"Novo usuário","email":"usuario@example.com","senha":"<SENHA-FORTE>"}'
```

O cadastro responde `201 Created`, por exemplo:

```json
{
  "mensagem": "Usuário criado com sucesso.",
  "id_usuario": 123
}
```

Teste o login enviando email e senha em JSON. Esta rota é pública e não exige token:

```bash
curl -X POST http://localhost:5000/usuario/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","senha":"<SENHA-FORTE>"}'
```

Com credenciais válidas, a resposta é `200 OK` e contém a mensagem, um JWT com validade de 8 horas e os dados públicos do usuário:

```json
{
  "mensagem": "Login realizado com sucesso.",
  "token": "<JWT-RETORNADO>",
  "usuario": {
    "id_usuario": 123,
    "nome": "Novo usuário",
    "email": "usuario@example.com"
  }
}
```

Para testar uma rota protegida, envie o token retornado em `Authorization: Bearer <JWT-RETORNADO>`. Não inclua senhas reais, hashes de senhas, tokens ou outras credenciais em arquivos do repositório; guarde segredos apenas em variáveis de ambiente ou no gerenciador secreto do provedor de hospedagem.

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
  -H "Authorization: Bearer <JWT-VALIDO>" \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"Bebidas\",\"descricao\":\"Bebidas e sucos\"}"
```

Exemplo de resposta (`201 Created`):

```json
{
  "mensagem": "Categoria cadastrada com sucesso.",
  "id_categoria": 1
}
```
