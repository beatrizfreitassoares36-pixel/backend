const express = require('express');
const router = express.Router();
const { Entrada } = require('../models');

function validarId(id) {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
}

function validarData(data) {
    if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
    const [ano, mes, dia] = data.split('-').map(Number);
    const validada = new Date(Date.UTC(ano, mes - 1, dia));
    return validada.getUTCFullYear() === ano &&
        validada.getUTCMonth() === mes - 1 &&
        validada.getUTCDate() === dia;
}

function responderErroBanco(res, error, mensagem) {
    const code = error.original?.code || error.code;
    if (code === 'ER_NO_REFERENCED_ROW_2' || code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).send({ mensagem: 'O produto ou fornecedor informado não existe.' });
    }
    console.error(mensagem, error);
    return res.status(500).send({ mensagem });
}

router.get('/', async (req, res) => {
    try {
        const entradas = await Entrada.findAll({
            order: [['id_entrada', 'DESC']],
            raw: true
        });
        return res.status(200).send({ entradas });
    } catch (error) {
        return responderErroBanco(res, error, 'Erro ao buscar entradas.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) return res.status(400).send({ mensagem: 'ID inválido.' });
    try {
        const entrada = await Entrada.findByPk(req.params.id, { raw: true });
        if (!entrada) return res.status(404).send({ mensagem: 'Entrada não encontrada.' });
        return res.status(200).send({ entrada });
    } catch (error) {
        return responderErroBanco(res, error, 'Erro ao buscar entrada.');
    }
});

router.post('/', async (req, res) => {
    const body = req.body || {};
    const {
        id_produto,
        id_fornecedor,
        quantidade,
        valor_unitario,
        data_entrada,
        observacao
    } = body;

    if (!validarId(id_produto) || !validarId(id_fornecedor)) {
        return res.status(400).send({ mensagem: 'Informe IDs válidos para produto e fornecedor.' });
    }
    if (!Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0) {
        return res.status(400).send({ mensagem: 'A quantidade deve ser um número inteiro maior que zero.' });
    }
    if (valor_unitario === undefined || valor_unitario === null || valor_unitario === '' ||
        !Number.isFinite(Number(valor_unitario)) || Number(valor_unitario) < 0) {
        return res.status(400).send({ mensagem: 'O valor unitário deve ser um número igual ou maior que zero.' });
    }
    if (data_entrada !== undefined && !validarData(data_entrada)) {
        return res.status(400).send({ mensagem: 'A data deve estar no formato YYYY-MM-DD e ser válida.' });
    }
    if (observacao !== undefined && observacao !== null && typeof observacao !== 'string') {
        return res.status(400).send({ mensagem: 'A observação deve ser um texto.' });
    }

    const dados = {
        id_produto: Number(id_produto),
        id_fornecedor: Number(id_fornecedor),
        quantidade: Number(quantidade),
        valor_unitario: Number(valor_unitario)
    };
    if (data_entrada !== undefined) dados.data_entrada = data_entrada;
    if (observacao !== undefined) dados.observacao = observacao;

    try {
        const entrada = await Entrada.create(dados);
        return res.status(201).send({
            mensagem: 'Entrada registrada com sucesso.',
            id_entrada: entrada.id_entrada
        });
    } catch (error) {
        return responderErroBanco(res, error, 'Erro ao registrar entrada.');
    }
});

module.exports = router;
