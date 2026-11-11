const idField = (label, key) => ({ name: key, label, type: 'number', required: true, min: 1 });
const optionalText = (label, name, extra = {}) => ({
  name, label, type: 'text', nullable: true, ...extra
});
const requiredText = (label, name, extra = {}) => ({
  name, label, type: 'text', required: true, ...extra
});
const currency = (label, name, required = true) => ({
  name, label, type: 'number', required, min: 0, step: '0.01'
});
const positiveInteger = (label, name) => ({
  name, label, type: 'number', required: true, min: 1, step: '1'
});

export const modules = [
  {
    key: 'produtos', label: 'Produtos', icon: '▦', endpoint: '/produtos',
    listKey: 'produtos', detailKey: 'produto', idKey: 'id_produto',
    description: 'Catálogo de produtos e preços.',
    columns: [
      ['id_produto', 'Código'], ['nome', 'Produto'], ['preco', 'Preço'],
      ['id_categoria', 'Categoria'], ['descricao', 'Descrição']
    ],
    fields: [
      requiredText('Nome', 'nome'),
      { name: 'descricao', label: 'Descrição', type: 'textarea', nullable: true },
      currency('Preço', 'preco'),
      optionalText('URL da imagem', 'imagem_produto'),
      {
        ...idField('Categoria', 'id_categoria'), required: false, nullable: true,
        options: { endpoint: '/categorias', key: 'categorias', id: 'id_categoria', label: 'nome' }
      }
    ],
    operations: ['create', 'edit', 'delete']
  },
  {
    key: 'categorias', label: 'Categorias', icon: '◫', endpoint: '/categorias',
    listKey: 'categorias', detailKey: 'categoria', idKey: 'id_categoria',
    description: 'Organize o catálogo por categoria.',
    columns: [['id_categoria', 'Código'], ['nome', 'Categoria'], ['descricao', 'Descrição']],
    fields: [
      requiredText('Nome', 'nome'),
      { name: 'descricao', label: 'Descrição', type: 'textarea', nullable: true }
    ],
    operations: ['create', 'edit', 'delete']
  },
  {
    key: 'estoque', label: 'Estoque', icon: '▤', endpoint: '/estoque',
    listKey: 'estoque', detailKey: 'item', idKey: 'id_produto',
    description: 'Consulte quantidades e atualize limites e localização.',
    columns: [
      ['id_produto', 'Produto #'], ['produto', 'Produto'], ['quantidade', 'Disponível'],
      ['estoque_minimo', 'Mínimo'], ['estoque_maximo', 'Máximo'], ['localizacao', 'Localização']
    ],
    fields: [
      { name: 'estoque_minimo', label: 'Estoque mínimo', type: 'number', min: 0, step: 1, nullable: true },
      { name: 'estoque_maximo', label: 'Estoque máximo', type: 'number', min: 0, step: 1, nullable: true },
      optionalText('Localização', 'localizacao')
    ],
    operations: ['edit']
  },
  {
    key: 'entradas', label: 'Entradas', icon: '↓', endpoint: '/entradas',
    listKey: 'entradas', detailKey: 'entrada', idKey: 'id_entrada',
    description: 'Registre recebimentos de produtos no estoque.',
    columns: [
      ['id_entrada', 'Código'], ['id_produto', 'Produto #'], ['id_fornecedor', 'Fornecedor #'],
      ['quantidade', 'Quantidade'], ['valor_unitario', 'Valor unitário'], ['data_entrada', 'Data']
    ],
    fields: [
      {
        ...idField('Produto', 'id_produto'),
        options: { endpoint: '/produtos', key: 'produtos', id: 'id_produto', label: 'nome' }
      },
      {
        ...idField('Fornecedor', 'id_fornecedor'),
        options: { endpoint: '/fornecedores', key: 'fornecedores', id: 'id_fornecedor', label: 'nome' }
      },
      positiveInteger('Quantidade', 'quantidade'),
      currency('Valor unitário', 'valor_unitario'),
      { name: 'data_entrada', label: 'Data de entrada', type: 'date', nullable: true },
      { name: 'observacao', label: 'Observação', type: 'textarea', nullable: true }
    ],
    operations: ['create']
  },
  {
    key: 'saidas', label: 'Saídas', icon: '↑', endpoint: '/saidas',
    listKey: 'saidas', detailKey: 'saida', idKey: 'id_saida',
    description: 'Registre saídas; a API valida o saldo em estoque.',
    columns: [
      ['id_saida', 'Código'], ['id_produto', 'Produto #'], ['id_funcionario', 'Funcionário #'],
      ['quantidade', 'Quantidade'], ['valor_unitario', 'Valor unitário'], ['data_saida', 'Data']
    ],
    fields: [
      {
        ...idField('Produto', 'id_produto'),
        options: { endpoint: '/produtos', key: 'produtos', id: 'id_produto', label: 'nome' }
      },
      {
        ...idField('Funcionário', 'id_funcionario'),
        options: { endpoint: '/funcionario', key: 'funcionarios', id: 'id_funcionario', label: 'nome' }
      },
      positiveInteger('Quantidade', 'quantidade'),
      currency('Valor unitário', 'valor_unitario'),
      { name: 'data_saida', label: 'Data de saída', type: 'date', nullable: true },
      optionalText('Destino', 'destino')
    ],
    operations: ['create']
  },
  {
    key: 'clientes', label: 'Clientes', icon: '◎', endpoint: '/clientes',
    listKey: 'clientes', detailKey: 'cliente', idKey: 'id_cliente',
    description: 'Cadastro e consulta de clientes.',
    columns: [['id_cliente', 'Código'], ['nome', 'Nome'], ['email', 'Email'], ['contato', 'Contato']],
    fields: [
      requiredText('Nome', 'nome'),
      { ...requiredText('Email', 'email'), type: 'email' },
      optionalText('Contato', 'contato')
    ],
    operations: ['create', 'edit', 'delete']
  },
  {
    key: 'fornecedores', label: 'Fornecedores', icon: '◇', endpoint: '/fornecedores',
    listKey: 'fornecedores', detailKey: 'fornecedor', idKey: 'id_fornecedor',
    description: 'Cadastro de fornecedores e contatos comerciais.',
    columns: [
      ['id_fornecedor', 'Código'], ['nome', 'Nome'], ['empresa', 'Empresa'],
      ['email', 'Email'], ['telefone', 'Telefone'], ['cidade', 'Cidade'], ['estado', 'UF']
    ],
    fields: [
      requiredText('Nome', 'nome'),
      optionalText('Empresa', 'empresa'),
      { ...optionalText('Email', 'email'), type: 'email' },
      optionalText('Telefone', 'telefone'),
      optionalText('Cidade', 'cidade'),
      { ...optionalText('Estado', 'estado'), maxLength: 2 }
    ],
    operations: ['create', 'edit', 'delete']
  },
  {
    key: 'funcionario', label: 'Funcionários', icon: '♙', endpoint: '/funcionario',
    listKey: 'funcionarios', detailKey: 'funcionario', idKey: 'id_funcionario',
    description: 'Cadastro dos funcionários e cargos.',
    columns: [
      ['id_funcionario', 'Código'], ['nome', 'Nome'], ['cargo', 'Cargo'],
      ['salario', 'Salário'], ['telefone', 'Telefone'], ['email', 'Email']
    ],
    fields: [
      requiredText('Nome', 'nome'),
      requiredText('Cargo', 'cargo'),
      currency('Salário', 'salario'),
      optionalText('Telefone', 'telefone'),
      { ...optionalText('Email', 'email'), type: 'email' },
      { name: 'data_admissao', label: 'Data de admissão', type: 'date', nullable: true }
    ],
    operations: ['create', 'edit', 'delete']
  },
  {
    key: 'pedidos', label: 'Pedidos', icon: '▧', endpoint: '/pedidos',
    listKey: 'pedidos', detailKey: 'pedido', idKey: 'id_pedido',
    description: 'Crie pedidos e consulte seus itens.',
    columns: [
      ['id_pedido', 'Pedido'], ['cliente', 'Cliente'], ['status', 'Status'],
      ['data_pedido', 'Data'], ['id_cliente', 'Cliente #']
    ],
    fields: [
      {
        name: 'status', label: 'Status', type: 'select', valueType: 'number', defaultValue: '1',
        options: [
          { value: '1', label: 'Ativo' },
          { value: '0', label: 'Inativo' }
        ]
      },
      { name: 'data_pedido', label: 'Data do pedido', type: 'date', nullable: true },
      {
        ...idField('Cliente', 'id_cliente'), required: false, nullable: true,
        options: { endpoint: '/clientes', key: 'clientes', id: 'id_cliente', label: 'nome' }
      }
    ],
    operations: ['create', 'edit']
  },
  {
    key: 'pedido-itens', label: 'Itens de pedido', icon: '≡', endpoint: '/pedido-itens',
    listKey: 'itens', detailKey: 'item', idKey: 'id_item',
    description: 'Adicione produtos aos pedidos; o subtotal é calculado pela API.',
    columns: [
      ['id_item', 'Item'], ['id_pedido', 'Pedido #'], ['produto', 'Produto'],
      ['quantidade', 'Quantidade'], ['valor_unitario', 'Valor unitário'], ['subtotal', 'Subtotal']
    ],
    fields: [
      {
        ...idField('Pedido', 'id_pedido'),
        options: { endpoint: '/pedidos', key: 'pedidos', id: 'id_pedido', label: 'id_pedido', prefix: 'Pedido #' }
      },
      {
        ...idField('Produto', 'id_produto'),
        options: { endpoint: '/produtos', key: 'produtos', id: 'id_produto', label: 'nome' }
      },
      positiveInteger('Quantidade', 'quantidade'),
      currency('Valor unitário', 'valor_unitario')
    ],
    operations: ['create', 'edit', 'delete']
  },
  {
    key: 'movimentacoes', label: 'Movimentações', icon: '↔', endpoint: '/movimentacoes',
    listKey: 'movimentacoes', detailKey: 'movimentacao', idKey: 'id_movimentacao',
    description: 'Consulte e registre movimentações de inventário.',
    columns: [
      ['id_movimentacao', 'Código'], ['produto', 'Produto'], ['tipo', 'Tipo'],
      ['quantidade', 'Quantidade'], ['data_movimentacao', 'Data'], ['observacao', 'Observação']
    ],
    fields: [
      {
        ...idField('Produto', 'id_produto'), required: false, nullable: true,
        options: { endpoint: '/produtos', key: 'produtos', id: 'id_produto', label: 'nome' }
      },
      {
        name: 'tipo', label: 'Tipo', type: 'select', nullable: true,
        options: [
          { value: 'E', label: 'Entrada (E)' },
          { value: 'S', label: 'Saída (S)' },
          { value: 'A', label: 'Ajuste (A)' },
          { value: 'P', label: 'Pedido (P)' },
          { value: 'T', label: 'Transferência (T)' }
        ]
      },
      { name: 'quantidade', label: 'Quantidade', type: 'number', min: 0, step: 1, nullable: true },
      { name: 'data_movimentacao', label: 'Data', type: 'date', nullable: true },
      { name: 'observacao', label: 'Observação', type: 'textarea', nullable: true }
    ],
    operations: ['create']
  },
  {
    key: 'historico-precos', label: 'Histórico de preços', icon: '⌁', endpoint: '/historico-precos',
    listKey: 'historico', detailKey: 'registro', idKey: 'id_historico',
    description: 'Registre preços e suas datas de vigência.',
    columns: [['id_historico', 'Código'], ['produto', 'Produto'], ['preco', 'Preço'], ['vigencia', 'Vigência']],
    fields: [
      {
        ...idField('Produto', 'id_produto'),
        options: { endpoint: '/produtos', key: 'produtos', id: 'id_produto', label: 'nome' }
      },
      currency('Preço', 'preco'),
      { name: 'vigencia', label: 'Vigência', type: 'date', nullable: true }
    ],
    operations: ['create']
  },
  {
    key: 'logs', label: 'Logs', icon: '≋', endpoint: '/logs',
    listKey: 'logs', detailKey: 'log', idKey: 'id_log',
    description: 'Consulte e registre logs de ações.',
    columns: [
      ['id_log', 'Código'], ['usuario', 'Usuário'], ['tabela_afetada', 'Tabela'],
      ['acao', 'Ação'], ['registro', 'Registro #'], ['data_hora', 'Data e hora']
    ],
    fields: [
      optionalText('Usuário', 'usuario'),
      optionalText('Tabela afetada', 'tabela_afetada'),
      optionalText('Ação', 'acao'),
      { name: 'registro', label: 'ID do registro', type: 'number', min: 1, nullable: true },
      { name: 'data_hora', label: 'Data e hora', type: 'datetime-local', nullable: true }
    ],
    operations: ['create']
  },
  {
    key: 'usuario', label: 'Usuários', icon: '♧', endpoint: '/usuario',
    listKey: 'usuarios', detailKey: 'usuario', idKey: 'id_usuario',
    description: 'Gerencie usuários ativos. Cadastro requer autenticação administrativa.',
    columns: [
      ['id_usuario', 'Código'], ['nome', 'Nome'], ['email', 'Email'],
      ['contato', 'Contato'], ['genero', 'Gênero']
    ],
    fields: [
      requiredText('Nome', 'nome'),
      { ...requiredText('Email', 'email'), type: 'email' },
      { name: 'senha', label: 'Senha (mínimo 8 caracteres)', type: 'password', requiredOnCreate: true, minLength: 8 },
      optionalText('Contato', 'contato'),
      { ...optionalText('Gênero', 'genero'), maxLength: 1 }
    ],
    operations: ['create', 'edit', 'delete']
  }
];
