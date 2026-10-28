# API de gerenciamento de loja

## Objetivo

Esta API foi desenvolvida para centralizar e automatizar o controle operacional de uma loja, permitindo o gerenciamento de produtos, estoque, clientes, fornecedores, funcionários, pedidos e movimentações de forma segura e organizada.

A aplicação foi criada em Node.js com Express e MySQL, e sua principal finalidade é fornecer uma base para o backend de um sistema de gestão comercial, facilitando o registro e a consulta de informações em tempo real por meio de endpoints REST.

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

- Node.js
- Express
- MySQL
- JWT (para autenticação de usuários)
- bcryptjs (hash de senhas)
- dotenv para configuração de ambiente
- CORS para controle de acessos

## Executar

Requisitos: Node.js, npm e um servidor MySQL com o esquema da aplicação.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure um arquivo `.env` na raiz:

   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   DB_NAME=nome_do_banco
   CORS_ORIGIN=http://localhost:3000
   ```

   `PORT` e `DB_PORT` são opcionais (padrões: `5000` e `3306`). `CORS_ORIGIN` também é opcional; sem ele, a API aceita requisições de qualquer origem. Para permitir mais de uma origem, informe uma lista separada por vírgulas.

3. Inicie a aplicação:

   ```bash
   npm start
   ```

   Para desenvolvimento com reinicialização automática:

   ```bash
   npm run dev
   ```

A API escuta em `0.0.0.0`. O endereço local padrão é `http://localhost:5000`. O arquivo `beatrizfreitassoares_loja_oficial.sql` contém o esquema e dados de exemplo do banco.

## Convenções

- Os caminhos abaixo são relativos à origem da API; não há prefixo `/api`.
- Os corpos das requisições devem ser enviados em JSON (`Content-Type: application/json`).
- Datas de calendário aceitas nos campos correspondentes usam `YYYY-MM-DD`.
- IDs devem ser inteiros positivos.
- Listas são retornadas dentro de uma propriedade com o nome indicado na tabela; consultas por ID retornam o objeto correspondente. As respostas também podem conter `mensagem`.
- Campos não indicados para `PATCH` não são atualizados. Campos omitidos em `PATCH` permanecem inalterados; alguns campos opcionais aceitam `null`, conforme descrito abaixo.
- Não há paginação, filtros de listagem ou autenticação implementados nas rotas documentadas.
- Erros de validação retornam HTTP `400`; registros ausentes, `404`; conflitos, `409`; erros internos, `500`. Em geral, as rotas retornam `{ "mensagem": "..." }`. Erros tratados pelo middleware global retornam `{ "erro": { "mensagem": "..." } }`.

## Verificação

`GET /teste` retorna HTTP `200` e `{ "mensagem": "Tudo OK" }`.

## Endpoints

### Usuários — `/usuario`

| Método e caminho | Descrição | Corpo / resposta |
|---|---|---|
| `GET /usuario` | Lista usuários ativos. | Resposta: `{ "usuarios": [...] }`; a senha nunca é retornada. |
| `GET /usuario/:id` | Busca usuário ativo pelo ID. | Resposta: `{ "usuario": {...} }`. |
| `POST /usuario` | Cadastra usuário. | Obrigatórios: `nome`, `email`, `senha` (mínimo 8 caracteres). Opcionais: `contato`, `genero` (texto ou `null`). A senha é armazenada como hash. Retorna `id_usuario`. |
| `PATCH /usuario/:id` | Atualiza usuário ativo. | Aceita `nome`, `email`, `senha`, `contato`, `genero`. A senha, se enviada, também precisa ter ao menos 8 caracteres e é armazenada como hash. |
| `DELETE /usuario/:id` | Desativa usuário (exclusão lógica). | — |

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
