const express = require('express');
const router = express.Router();
const { HistoricoPreco, Produto } = require('../models');
const { validarId, validarData, responderErro } = require('./helpers');

router.get('/', async (req, res) => {
    try {
        const registros = await HistoricoPreco.findAll({
            attributes: ['id_historico', 'id_produto', 'preco', 'vigencia'],
            include: [{ model: Produto, as: 'produtoInfo', attributes: ['nome'] }],
            order: [['vigencia', 'DESC'], ['id_historico', 'DESC']]
        });
        const historico = registros.map(registro => {
            const item = { ...registro.toJSON(), produto: registro.produtoInfo?.nome ?? null };
            delete item.produtoInfo;
            return item;
        });
        return res.status(200).send({ historico });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar histórico de preços.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }
    try {
        const registro = await HistoricoPreco.findByPk(req.params.id, {
            attributes: ['id_historico', 'id_produto', 'preco', 'vigencia'],
            include: [{ model: Produto, as: 'produtoInfo', attributes: ['nome'] }]
        });
        if (!registro) {
            return res.status(404).send({ mensagem: 'Registro de preço não encontrado.' });
        }
        const item = { ...registro.toJSON(), produto: registro.produtoInfo?.nome ?? null };
        delete item.produtoInfo;
        return res.status(200).send({ registro: item });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar registro de preço.');
    }
});

router.post('/', async (req, res) => {
    const body = req.body || {};
    const { id_produto, preco, vigencia = null } = body;
    if (!validarId(id_produto)) {
        return res.status(400).send({ mensagem: 'ID do produto inválido.' });
    }
    if (preco === undefined || preco === null || preco === '' ||
        !Number.isFinite(Number(preco)) || Number(preco) < 0) {
        return res.status(400).send({ mensagem: 'Preço inválido.' });
    }
    if (vigencia !== null && !validarData(vigencia)) {
        return res.status(400).send({ mensagem: 'Vigência deve ser uma data válida no formato YYYY-MM-DD.' });
    }

    try {
        const registro = await HistoricoPreco.create({
            id_produto: Number(id_produto),
            preco: Number(preco),
            vigencia
        });
        return res.status(201).send({
            mensagem: 'Preço registrado no histórico.',
            id_historico: registro.id_historico
        });
    } catch (error) {
        return responderErro(res, error, 'Erro ao registrar preço.');
    }
});

module.exports = router;
