
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '1mb' }));
app.use(cors({
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use('/usuario', require('./route/routeUsuario'));
app.use('/funcionario', require('./route/routeFuncionario'));
app.use('/categorias', require('./route/routeCategoria'));
app.use('/clientes', require('./route/routeCliente'));
app.use('/fornecedores', require('./route/routeFornecedores'));
app.use('/produtos', require('./route/routeProduto'));
app.use('/entradas', require('./route/routeEntradas'));
app.use('/saidas', require('./route/routeSaida'));
app.use('/estoque', require('./route/routeEstoque'));
app.use('/pedidos', require('./route/routePedido'));
app.use('/pedido-itens', require('./route/routePedidoItem'));
app.use('/movimentacoes', require('./route/routeMovimentacao'));
app.use('/historico-precos', require('./route/routeHistoricoPreco'));
app.use('/logs', require('./route/routeLog'));

app.get('/teste', (req, res) => {
    res.status(200).send({ mensagem: 'Tudo OK' });
});

app.use((req, res, next) => {
    const error = new Error('Não encontrado!');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const status = error.status || 500;
    if (status >= 500) {
        console.error('Erro não tratado na aplicação:', error);
    }

    return res.status(status).json({
        erro: {
            mensagem: status >= 500 ? 'Erro interno do servidor.' : error.message
        }
    });
});

module.exports = app
