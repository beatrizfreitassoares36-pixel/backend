const express = require('express');
const router = express.Router();
const { Movimentacao, Produto } = require('../models');
const { validarId, responderErro } = require('./helpers');

const tiposPermitidos = ['E', 'S', 'A', 'P', 'T'];

router.get('/', async (req, res) => {
    try {
        const registros = await Movimentacao.findAll({
            attributes: ['id_movimentacao', 'id_produto', 'tipo', 'quantidade', 'data_movimentacao', 'observacao'],
            include: [{ model: Produto, as: 'produtoInfo', attributes: ['nome'] }],
            order: [['id_movimentacao', 'DESC']]
        });
        const movimentacoes = registros.map(registro => {
            const item = { ...registro.toJSON(), produto: registro.produtoInfo?.nome ?? null };
            delete item.produtoInfo;
            return item;
        });
        return res.status(200).send({ movimentacoes });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar movimentações.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }
    try {
        const registro = await Movimentacao.findByPk(req.params.id, {
            attributes: ['id_movimentacao', 'id_produto', 'tipo', 'quantidade', 'data_movimentacao', 'observacao'],
            include: [{ model: Produto, as: 'produtoInfo', attributes: ['nome'] }]
        });
        if (!registro) {
            return res.status(404).send({ mensagem: 'Movimentação não encontrada.' });
        }
        const movimentacao = { ...registro.toJSON(), produto: registro.produtoInfo?.nome ?? null };
        delete movimentacao.produtoInfo;
        return res.status(200).send({ movimentacao });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar movimentação.');
    }
});

router.post('/', async (req, res) => {
    const body = req.body || {};
    const { id_produto = null, tipo, quantidade = null, data_movimentacao = null, observacao = null } = body;
    if (id_produto !== null && !validarId(id_produto)) {
        return res.status(400).send({ mensagem: 'ID do produto inválido.' });
    }
    if (tipo !== undefined && tipo !== null && !tiposPermitidos.includes(tipo)) {
        return res.status(400).send({ mensagem: 'Tipo inválido. Use E, S, A, P ou T.' });
    }
    if (quantidade !== null &&
        (!Number.isInteger(Number(quantidade)) || Number(quantidade) < 0)) {
        return res.status(400).send({ mensagem: 'Quantidade inválida.' });
    }
    if (data_movimentacao !== null &&
        (typeof data_movimentacao !== 'string' || Number.isNaN(Date.parse(data_movimentacao)))) {
        return res.status(400).send({ mensagem: 'Data da movimentação inválida.' });
    }
    if (observacao !== null && typeof observacao !== 'string') {
        return res.status(400).send({ mensagem: 'Observação inválida.' });
    }

    try {
        const movimentacao = await Movimentacao.create({
            id_produto: id_produto === null ? null : Number(id_produto),
            tipo: tipo || null,
            quantidade: quantidade === null ? null : Number(quantidade),
            data_movimentacao,
            observacao
        });
        return res.status(201).send({
            mensagem: 'Movimentação registrada.',
            id_movimentacao: movimentacao.id_movimentacao
        });
    } catch (error) {
        return responderErro(res, error, 'Erro ao registrar movimentação.');
    }
});

module.exports = router;
