const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

function define(name, tableName, primaryKey, fields) {
    return sequelize.define(name, {
        [primaryKey]: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        ...fields
    }, {
        tableName,
        timestamps: false,
        freezeTableName: true
    });
}

const Categoria = define('Categoria', 'categorias', 'id_categoria', {
    nome: { type: DataTypes.STRING(100), allowNull: false },
    descricao: DataTypes.TEXT,
    ativo: { type: DataTypes.TINYINT, defaultValue: 1 }
});

const Cliente = define('Cliente', 'clientes', 'id_cliente', {
    nome: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false },
    contato: DataTypes.STRING(20),
    ativo: { type: DataTypes.TINYINT, defaultValue: 1 },
    criado_em: DataTypes.DATE,
    atualizado_em: DataTypes.DATE
});

const Entrada = define('Entrada', 'entradas', 'id_entrada', {
    id_produto: { type: DataTypes.INTEGER, allowNull: false },
    id_fornecedor: { type: DataTypes.INTEGER, allowNull: false },
    quantidade: { type: DataTypes.INTEGER, allowNull: false },
    valor_unitario: { type: DataTypes.DOUBLE(10, 2), allowNull: false },
    data_entrada: DataTypes.DATEONLY,
    observacao: DataTypes.STRING(200),
    criado_em: DataTypes.DATE,
    atualizado_em: DataTypes.DATE
});

const Estoque = define('Estoque', 'estoque', 'id_estoque', {
    id_produto: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    quantidade: { type: DataTypes.INTEGER, allowNull: false },
    estoque_minimo: DataTypes.INTEGER,
    estoque_maximo: DataTypes.INTEGER,
    localizacao: DataTypes.STRING(100)
});

const Fornecedor = define('Fornecedor', 'fornecedores', 'id_fornecedor', {
    nome: { type: DataTypes.STRING(100), allowNull: false },
    empresa: DataTypes.STRING(100),
    email: DataTypes.STRING(100),
    telefone: DataTypes.STRING(20),
    cidade: DataTypes.STRING(50),
    estado: DataTypes.STRING(2),
    ativo: { type: DataTypes.TINYINT, defaultValue: 1 },
    criado_em: DataTypes.DATE,
    atualizado_em: DataTypes.DATE
});

const Funcionario = define('Funcionario', 'funcionarios', 'id_funcionario', {
    nome: { type: DataTypes.STRING(100), allowNull: false },
    cargo: { type: DataTypes.STRING(50), allowNull: false },
    salario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    telefone: DataTypes.STRING(20),
    email: DataTypes.STRING(100),
    data_admissao: DataTypes.DATEONLY,
    ativo: { type: DataTypes.TINYINT, defaultValue: 1 },
    criado_em: DataTypes.DATE,
    atualizado_em: DataTypes.DATE
});

const HistoricoPreco = define('HistoricoPreco', 'historico_precos', 'id_historico', {
    id_produto: DataTypes.INTEGER,
    preco: DataTypes.DECIMAL(10, 2),
    vigencia: DataTypes.DATEONLY
});

const Log = define('Log', 'logs', 'id_log', {
    usuario: DataTypes.STRING(100),
    tabela_afetada: DataTypes.STRING(100),
    acao: DataTypes.STRING(50),
    registro: DataTypes.INTEGER,
    data_hora: DataTypes.DATE
});

const Movimentacao = define('Movimentacao', 'movimentacoes', 'id_movimentacao', {
    id_produto: DataTypes.INTEGER,
    tipo: DataTypes.ENUM('E', 'S', 'A', 'P', 'T'),
    quantidade: DataTypes.INTEGER,
    data_movimentacao: DataTypes.DATE,
    observacao: DataTypes.TEXT
});

const Pedido = define('Pedido', 'pedidos', 'id_pedido', {
    status: { type: DataTypes.TINYINT, defaultValue: 1 },
    data_pedido: DataTypes.DATEONLY,
    id_cliente: DataTypes.INTEGER,
    criado_em: DataTypes.DATE,
    atualizado_em: DataTypes.DATE
});

const PedidoItem = define('PedidoItem', 'pedido_itens', 'id_item', {
    id_pedido: DataTypes.INTEGER,
    id_produto: DataTypes.INTEGER,
    quantidade: DataTypes.INTEGER,
    valor_unitario: DataTypes.DECIMAL(10, 2),
    subtotal: DataTypes.DECIMAL(10, 2)
});

const Produto = define('Produto', 'produtos', 'id_produto', {
    nome: DataTypes.STRING(100),
    descricao: { type: DataTypes.STRING(200), allowNull: false },
    preco: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    imagem_produto: { type: DataTypes.STRING(255), allowNull: false },
    criado_em: DataTypes.DATE,
    atualizado_em: DataTypes.DATE,
    id_categoria: DataTypes.INTEGER
});

const Saida = define('Saida', 'saidas', 'id_saida', {
    id_produto: { type: DataTypes.INTEGER, allowNull: false },
    id_funcionario: { type: DataTypes.INTEGER, allowNull: false },
    quantidade: { type: DataTypes.INTEGER, allowNull: false },
    valor_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    data_saida: DataTypes.DATEONLY,
    destino: DataTypes.STRING(100),
    criado_em: DataTypes.DATE,
    atualizado_em: DataTypes.DATE
});

const Usuario = define('Usuario', 'usuarios', 'id_usu', {
    nome: { type: DataTypes.STRING(80), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false },
    senha: { type: DataTypes.STRING(255), allowNull: false },
    contato: DataTypes.STRING(20),
    genero: DataTypes.STRING(1),
    ativo: { type: DataTypes.TINYINT, defaultValue: 1 },
    criado_em: DataTypes.DATE,
    atualizado_em: DataTypes.DATE
});

Categoria.hasMany(Produto, { as: 'produtos', foreignKey: 'id_categoria', constraints: false });
Produto.belongsTo(Categoria, { as: 'categoria', foreignKey: 'id_categoria', constraints: false });
Produto.hasOne(Estoque, { as: 'estoque', foreignKey: 'id_produto', constraints: false });
Estoque.belongsTo(Produto, { as: 'produtoInfo', foreignKey: 'id_produto', constraints: false });
Produto.hasMany(Entrada, { as: 'entradas', foreignKey: 'id_produto', constraints: false });
Entrada.belongsTo(Produto, { as: 'produtoInfo', foreignKey: 'id_produto', constraints: false });
Fornecedor.hasMany(Entrada, { as: 'entradas', foreignKey: 'id_fornecedor', constraints: false });
Entrada.belongsTo(Fornecedor, { as: 'fornecedorInfo', foreignKey: 'id_fornecedor', constraints: false });
Produto.hasMany(Saida, { as: 'saidas', foreignKey: 'id_produto', constraints: false });
Saida.belongsTo(Produto, { as: 'produtoInfo', foreignKey: 'id_produto', constraints: false });
Funcionario.hasMany(Saida, { as: 'saidas', foreignKey: 'id_funcionario', constraints: false });
Saida.belongsTo(Funcionario, { as: 'funcionarioInfo', foreignKey: 'id_funcionario', constraints: false });
Cliente.hasMany(Pedido, { as: 'pedidos', foreignKey: 'id_cliente', constraints: false });
Pedido.belongsTo(Cliente, { as: 'cliente', foreignKey: 'id_cliente', constraints: false });
Pedido.hasMany(PedidoItem, { as: 'itens', foreignKey: 'id_pedido', constraints: false });
PedidoItem.belongsTo(Pedido, { as: 'pedido', foreignKey: 'id_pedido', constraints: false });
Produto.hasMany(PedidoItem, { as: 'itensPedido', foreignKey: 'id_produto', constraints: false });
PedidoItem.belongsTo(Produto, { as: 'produtoInfo', foreignKey: 'id_produto', constraints: false });
Produto.hasMany(Movimentacao, { as: 'movimentacoes', foreignKey: 'id_produto', constraints: false });
Movimentacao.belongsTo(Produto, { as: 'produtoInfo', foreignKey: 'id_produto', constraints: false });
Produto.hasMany(HistoricoPreco, { as: 'historicoPrecos', foreignKey: 'id_produto', constraints: false });
HistoricoPreco.belongsTo(Produto, { as: 'produtoInfo', foreignKey: 'id_produto', constraints: false });

module.exports = {
    sequelize,
    Categoria,
    Cliente,
    Entrada,
    Estoque,
    Fornecedor,
    Funcionario,
    HistoricoPreco,
    Log,
    Movimentacao,
    Pedido,
    PedidoItem,
    Produto,
    Saida,
    Usuario
};
