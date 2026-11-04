const text = (name, label, options = {}) => ({ name, label, type: 'text', ...options });
const number = (name, label, options = {}) => ({ name, label, type: 'number', ...options });
const date = (name, label, options = {}) => ({ name, label, type: 'date', ...options });
const select = (name, label, options, extra = {}) => ({
  name, label, type: 'select', options, ...extra
});

export const modules = [
  {
    id: 'usuarios', title: 'Usuários', singular: 'usuário', endpoint: '/usuario', listKey: 'usuarios',
    itemKey: 'usuario', idField: 'id_usuario', icon: 'users',
    columns: ['id_usuario', 'nome', 'email', 'contato', 'ativo'],
    createFields: [
      text('nome', 'Nome', { required: true }),
      text('email', 'E-mail', { required: true, inputType: 'email' }),
      text('senha', 'Senha', { required: true, inputType: 'password', minLength: 8 }),
      text('contato', 'Contato', { nullable: true }),
      text('genero', 'Gênero', { nullable: true })
    ],
    editFields: [
      text('nome', 'Nome'), text('email', 'E-mail', { inputType: 'email' }),
      text('senha', 'Nova senha', { inputType: 'password', minLength: 8 }),
      text('contato', 'Contato', { nullable: true }), text('genero', 'Gênero', { nullable: true })
    ],
    deleteLabel: 'Desativar'
  },
  {
    id: 'funcionarios', title: 'Funcionários', singular: 'funcionário', endpoint: '/funcionario', listKey: 'funcionarios',
    itemKey: 'funcionario', idField: 'id_funcionario', icon: 'briefcase',
    columns: ['id_funcionario', 'nome', 'cargo', 'salario', 'email', 'ativo'],
    createFields: [
      text('nome', 'Nome', { required: true }), text('cargo', 'Cargo', { required: true }),
      number('salario', 'Salário', { required: true, min: 0, step: '0.01' }),
      text('telefone', 'Telefone', { nullable: true }), text('email', 'E-mail', { inputType: 'email', nullable: true }),
      date('data_admissao', 'Data de admissão', { nullable: true })
    ],
    editFields: [
      text('nome', 'Nome'), text('cargo', 'Cargo'),
      number('salario', 'Salário', { min: 0, step: '0.01' }),
      text('telefone', 'Telefone', { nullable: true }), text('email', 'E-mail', { inputType: 'email', nullable: true }),
      date('data_admissao', 'Data de admissão', { nullable: true })
    ],
    deleteLabel: 'Desativar'
  },
  {
    id: 'categorias', title: 'Categorias', singular: 'categoria', endpoint: '/categorias', listKey: 'categorias',
    itemKey: 'categoria', idField: 'id_categoria', icon: 'tag',
    columns: ['id_categoria', 'nome', 'descricao', 'ativo'],
    createFields: [text('nome', 'Nome', { required: true }), text('descricao', 'Descrição', { multiline: true })],
    editFields: [text('nome', 'Nome'), text('descricao', 'Descrição', { multiline: true })],
    deleteLabel: 'Desativar'
  },
  {
    id: 'clientes', title: 'Clientes', singular: 'cliente', endpoint: '/clientes', listKey: 'clientes',
    itemKey: 'cliente', idField: 'id_cliente', icon: 'contact',
    columns: ['id_cliente', 'nome', 'email', 'contato', 'ativo'],
    createFields: [
      text('nome', 'Nome', { required: true }),
      text('email', 'E-mail', { required: true, inputType: 'email' }),
      text('contato', 'Contato', { nullable: true })
    ],
    editFields: [
      text('nome', 'Nome'), text('email', 'E-mail', { inputType: 'email' }),
      text('contato', 'Contato', { nullable: true })
    ],
    deleteLabel: 'Desativar'
  },
  {
    id: 'fornecedores', title: 'Fornecedores', singular: 'fornecedor', endpoint: '/fornecedores', listKey: 'fornecedores',
    itemKey: 'fornecedor', idField: 'id_fornecedor', icon: 'truck',
    columns: ['id_fornecedor', 'nome', 'empresa', 'email', 'telefone', 'cidade'],
    createFields: [
      text('nome', 'Nome', { required: true }), text('empresa', 'Empresa'),
      text('email', 'E-mail', { inputType: 'email', nullable: true }), text('telefone', 'Telefone', { nullable: true }),
      text('cidade', 'Cidade', { nullable: true }), text('estado', 'Estado', { nullable: true })
    ],
    editFields: [
      text('nome', 'Nome'), text('empresa', 'Empresa'),
      text('email', 'E-mail', { inputType: 'email', nullable: true }), text('telefone', 'Telefone', { nullable: true }),
      text('cidade', 'Cidade', { nullable: true }), text('estado', 'Estado', { nullable: true })
    ],
    deleteLabel: 'Desativar'
  },
  {
    id: 'produtos', title: 'Produtos', singular: 'produto', endpoint: '/produtos', listKey: 'produtos',
    itemKey: 'produto', idField: 'id_produto', icon: 'package',
    columns: ['id_produto', 'nome', 'preco', 'id_categoria', 'atualizado_em'],
    createFields: [
      text('nome', 'Nome', { required: true }),
      text('descricao', 'Descrição', { multiline: true, nullable: true }),
      number('preco', 'Preço', { required: true, min: 0, step: '0.01' }),
      text('imagem_produto', 'URL da imagem', { nullable: true }),
      number('id_categoria', 'ID da categoria', { min: 1, nullable: true })
    ],
    editFields: [
      text('nome', 'Nome'), text('descricao', 'Descrição', { multiline: true, nullable: true }),
      number('preco', 'Preço', { min: 0, step: '0.01' }),
      text('imagem_produto', 'URL da imagem', { nullable: true }),
      number('id_categoria', 'ID da categoria', { min: 1, nullable: true })
    ],
    deleteLabel: 'Excluir'
  },
  {
    id: 'estoque', title: 'Estoque', singular: 'item de estoque', endpoint: '/estoque', listKey: 'estoque',
    itemKey: 'item', idField: 'id_produto', icon: 'boxes',
    columns: ['id_produto', 'produto', 'quantidade', 'estoque_minimo', 'estoque_maximo', 'localizacao'],
    editFields: [
      number('estoque_minimo', 'Estoque mínimo', { min: 0, nullable: true }),
      number('estoque_maximo', 'Estoque máximo', { min: 0, nullable: true }),
      text('localizacao', 'Localização', { nullable: true })
    ]
  },
  {
    id: 'entradas', title: 'Entradas', singular: 'entrada', endpoint: '/entradas', listKey: 'entradas',
    itemKey: 'entrada', idField: 'id_entrada', icon: 'arrow-down-to-line',
    columns: ['id_entrada', 'id_produto', 'id_fornecedor', 'quantidade', 'valor_unitario', 'data_entrada'],
    createFields: [
      number('id_produto', 'ID do produto', { required: true, min: 1 }),
      number('id_fornecedor', 'ID do fornecedor', { required: true, min: 1 }),
      number('quantidade', 'Quantidade', { required: true, min: 1, step: 1 }),
      number('valor_unitario', 'Valor unitário', { required: true, min: 0, step: '0.01' }),
      date('data_entrada', 'Data da entrada'),
      text('observacao', 'Observação', { multiline: true })
    ]
  },
  {
    id: 'saidas', title: 'Saídas', singular: 'saída', endpoint: '/saidas', listKey: 'saidas',
    itemKey: 'saida', idField: 'id_saida', icon: 'arrow-up-from-line',
    columns: ['id_saida', 'id_produto', 'id_funcionario', 'quantidade', 'valor_unitario', 'data_saida'],
    createFields: [
      number('id_produto', 'ID do produto', { required: true, min: 1 }),
      number('id_funcionario', 'ID do funcionário', { required: true, min: 1 }),
      number('quantidade', 'Quantidade', { required: true, min: 1, step: 1 }),
      number('valor_unitario', 'Valor unitário', { required: true, min: 0, step: '0.01' }),
      date('data_saida', 'Data da saída'),
      text('destino', 'Destino')
    ]
  },
  {
    id: 'pedidos', title: 'Pedidos', singular: 'pedido', endpoint: '/pedidos', listKey: 'pedidos',
    itemKey: 'pedido', idField: 'id_pedido', icon: 'shopping-bag',
    columns: ['id_pedido', 'cliente', 'status', 'data_pedido', 'criado_em'],
    createFields: [
      select('status', 'Status', [{ label: 'Ativo', value: '1' }, { label: 'Inativo', value: '0' }]),
      date('data_pedido', 'Data do pedido'),
      number('id_cliente', 'ID do cliente', { min: 1, nullable: true })
    ],
    editFields: [
      select('status', 'Status', [{ label: 'Ativo', value: '1' }, { label: 'Inativo', value: '0' }]),
      date('data_pedido', 'Data do pedido'),
      number('id_cliente', 'ID do cliente', { min: 1, nullable: true })
    ]
  },
  {
    id: 'itens-pedido', title: 'Itens do pedido', singular: 'item do pedido', endpoint: '/pedido-itens', listKey: 'itens',
    itemKey: 'item', idField: 'id_item', icon: 'list-ordered',
    columns: ['id_item', 'id_pedido', 'produto', 'quantidade', 'valor_unitario', 'subtotal'],
    createFields: [
      number('id_pedido', 'ID do pedido', { required: true, min: 1 }),
      number('id_produto', 'ID do produto', { required: true, min: 1 }),
      number('quantidade', 'Quantidade', { required: true, min: 1, step: 1 }),
      number('valor_unitario', 'Valor unitário', { required: true, min: 0, step: '0.01' })
    ],
    editFields: [
      number('quantidade', 'Quantidade', { min: 1, step: 1 }),
      number('valor_unitario', 'Valor unitário', { min: 0, step: '0.01' })
    ],
    deleteLabel: 'Remover'
  },
  {
    id: 'movimentacoes', title: 'Movimentações', singular: 'movimentação', endpoint: '/movimentacoes',
    listKey: 'movimentacoes', itemKey: 'movimentacao', idField: 'id_movimentacao', icon: 'activity',
    columns: ['id_movimentacao', 'produto', 'tipo', 'quantidade', 'data_movimentacao'],
    createFields: [
      number('id_produto', 'ID do produto', { min: 1, nullable: true }),
      select('tipo', 'Tipo', [
        { label: 'Entrada', value: 'E' }, { label: 'Saída', value: 'S' },
        { label: 'Ajuste', value: 'A' }, { label: 'Pedido', value: 'P' },
        { label: 'Transferência', value: 'T' }
      ]),
      number('quantidade', 'Quantidade', { min: 0, step: 1, nullable: true }),
      date('data_movimentacao', 'Data da movimentação'),
      text('observacao', 'Observação', { multiline: true })
    ]
  },
  {
    id: 'historico-precos', title: 'Histórico de preços', singular: 'registro de preço', endpoint: '/historico-precos',
    listKey: 'historico', itemKey: 'registro', idField: 'id_historico', icon: 'chart-no-axes-combined',
    columns: ['id_historico', 'produto', 'preco', 'vigencia'],
    createFields: [
      number('id_produto', 'ID do produto', { required: true, min: 1 }),
      number('preco', 'Preço', { required: true, min: 0, step: '0.01' }),
      date('vigencia', 'Vigência')
    ]
  },
  {
    id: 'logs', title: 'Logs', singular: 'log', endpoint: '/logs', listKey: 'logs',
    itemKey: 'log', idField: 'id_log', icon: 'scroll-text',
    columns: ['id_log', 'usuario', 'tabela_afetada', 'acao', 'registro', 'data_hora'],
    createFields: [
      text('usuario', 'Usuário'), text('tabela_afetada', 'Tabela afetada'),
      text('acao', 'Ação'), number('registro', 'ID do registro', { min: 1, nullable: true }),
      text('data_hora', 'Data e hora', { inputType: 'datetime-local' })
    ]
  }
];
