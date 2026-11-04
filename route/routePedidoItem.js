const express = require('express');
const router = express.Router();
const { PedidoItem, Produto } = require('../models');
const { validarId, responderErro } = require('./helpers');

function validarItem(body) {
    return Number.isInteger(Number(body.quantidade)) &&
        Number(body.quantidade) > 0 &&
        Number.isFinite(Number(body.valor_unitario)) &&
        Number(body.valor_unitario) >= 0;
}

router.get('/', async (req, res) => {
    try {
        const registros = await PedidoItem.findAll({
            attributes: ['id_item', 'id_pedido', 'id_produto', 'quantidade', 'valor_unitario', 'subtotal'],
            include: [{ model: Produto, as: 'produtoInfo', attributes: ['nome'] }],
            order: [['id_item', 'DESC']]
        });
        const itens = registros.map(registro => {
            const item = { ...registro.toJSON(), produto: registro.produtoInfo?.nome ?? null };
            delete item.produtoInfo;
            return item;
        });
        return res.status(200).send({ itens });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar itens dos pedidos.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }
    try {
        const registro = await PedidoItem.findByPk(req.params.id, {
            attributes: ['id_item', 'id_pedido', 'id_produto', 'quantidade', 'valor_unitario', 'subtotal'],
            include: [{ model: Produto, as: 'produtoInfo', attributes: ['nome'] }]
        });
        if (!registro) {
            return res.status(404).send({ mensagem: 'Item do pedido não encontrado.' });
        }
        const item = { ...registro.toJSON(), produto: registro.produtoInfo?.nome ?? null };
        delete item.produtoInfo;
        return res.status(200).send({ item });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar item do pedido.');
    }
});

router.post('/', async (req, res) => {
    const body = req.body || {};
    if (!validarId(body.id_pedido) || !validarId(body.id_produto) || !validarItem(body)) {
        return res.status(400).send({
            mensagem: 'Informe pedido, produto, quantidade e valor unitário válidos.'
        });
    }
    const subtotal = Number((Number(body.quantidade) * Number(body.valor_unitario)).toFixed(2));
    try {
        const item = await PedidoItem.create({
            id_pedido: Number(body.id_pedido),
            id_produto: Number(body.id_produto),
            quantidade: Number(body.quantidade),
            valor_unitario: Number(body.valor_unitario),
            subtotal
        });
        return res.status(201).send({
            mensagem: 'Item adicionado ao pedido.',
            id_item: item.id_item,
            subtotal
        });
    } catch (error) {
        return responderErro(res, error, 'Erro ao adicionar item ao pedido.');
    }
});

router.patch('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }
    const body = req.body || {};
    const campos = ['quantidade', 'valor_unitario'].filter(campo => body[campo] !== undefined);
    if (!campos.length) {
        return res.status(400).send({ mensagem: 'Informe quantidade ou valor unitário.' });
    }
    const current = await PedidoItem.findByPk(req.params.id, {
        attributes: ['quantidade', 'valor_unitario'],
        raw: true
    }).catch(error => {
        responderErro(res, error, 'Erro ao buscar item do pedido.');
        return false;
    });
    if (!current) {
        if (current === false) return;
        return res.status(404).send({ mensagem: 'Item do pedido não encontrado.' });
    }

    const updated = { ...current, ...body };
    if (!validarItem(updated)) {
        return res.status(400).send({ mensagem: 'Quantidade e valor unitário devem ser válidos.' });
    }
    const subtotal = Number((Number(updated.quantidade) * Number(updated.valor_unitario)).toFixed(2));
    try {
        await PedidoItem.update({
            ...Object.fromEntries(campos.map(campo => [campo, Number(body[campo])])),
            subtotal
        }, { where: { id_item: req.params.id } });
        return res.status(200).send({ mensagem: 'Item atualizado.', subtotal });
    } catch (error) {
        return responderErro(res, error, 'Erro ao atualizar item do pedido.');
    }
});

router.delete('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }
    try {
        const removidos = await PedidoItem.destroy({ where: { id_item: req.params.id } });
        if (!removidos) {
            return res.status(404).send({ mensagem: 'Item do pedido não encontrado.' });
        }
        return res.status(200).send({ mensagem: 'Item removido do pedido.' });
    } catch (error) {
        return responderErro(res, error, 'Erro ao remover item do pedido.');
    }
});

module.exports = router;
