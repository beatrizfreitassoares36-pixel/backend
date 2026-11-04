
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const autenticar = require('./route/auth');
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

app.use('/usuario', require('./route/routeLogin'));
app.use('/usuario', autenticar, require('./route/routeUsuario'));
app.use('/funcionario', autenticar, require('./route/routeFuncionario'));
app.use('/categorias', autenticar, require('./route/routeCategoria'));
app.use('/clientes', autenticar, require('./route/routeCliente'));
app.use('/fornecedores', autenticar, require('./route/routeFornecedores'));
app.use('/produtos', autenticar, require('./route/routeProduto'));
app.use('/entradas', autenticar, require('./route/routeEntradas'));
app.use('/saidas', autenticar, require('./route/routeSaida'));
app.use('/estoque', autenticar, require('./route/routeEstoque'));
app.use('/pedidos', autenticar, require('./route/routePedido'));
app.use('/pedido-itens', autenticar, require('./route/routePedidoItem'));
app.use('/movimentacoes', autenticar, require('./route/routeMovimentacao'));
app.use('/historico-precos', autenticar, require('./route/routeHistoricoPreco'));
app.use('/logs', autenticar, require('./route/routeLog'));

app.get('/teste', (req, res) => {
    res.status(200).send({ mensagem: 'Tudo OK' });
});

const frontendDirectory = path.join(__dirname, 'frontend', 'dist');
const frontendIndex = path.join(frontendDirectory, 'index.html');
if (fs.existsSync(frontendIndex)) {
    app.use(express.static(frontendDirectory));
    app.get('*path', (req, res, next) => {
        if (req.accepts('html')) {
            return res.sendFile(frontendIndex);
        }
        return next();
    });
}

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
