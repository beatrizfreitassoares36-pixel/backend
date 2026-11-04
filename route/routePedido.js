const express = require('express');
const router = express.Router();
const { Pedido, Cliente, PedidoItem, Produto } = require('../models');
const { validarId, validarData, responderErro } = require('./helpers');

router.get('/', async (req, res) => {
    try {
        const registros = await Pedido.findAll({
            attributes: ['id_pedido', 'status', 'data_pedido', 'id_cliente', 'criado_em', 'atualizado_em'],
            include: [{ model: Cliente, as: 'cliente', attributes: ['nome'] }],
            order: [['id_pedido', 'DESC']]
        });
        const pedidos = registros.map(registro => {
            return { ...registro.toJSON(), cliente: registro.cliente?.nome ?? null };
        });
        return res.status(200).send({ pedidos });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar pedidos.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    try {
        const registro = await Pedido.findByPk(req.params.id, {
            attributes: ['id_pedido', 'status', 'data_pedido', 'id_cliente', 'criado_em', 'atualizado_em'],
            include: [
                { model: Cliente, as: 'cliente', attributes: ['nome'] },
                {
                    model: PedidoItem,
                    as: 'itens',
                    attributes: ['id_item', 'id_produto', 'quantidade', 'valor_unitario', 'subtotal'],
                    include: [{ model: Produto, as: 'produtoInfo', attributes: ['nome'] }]
                }
            ],
            order: [[{ model: PedidoItem, as: 'itens' }, 'id_item', 'ASC']]
        });
        if (!registro) {
            return res.status(404).send({ mensagem: 'Pedido não encontrado.' });
        }
        const pedido = { ...registro.toJSON() };
        pedido.cliente = registro.cliente?.nome ?? null;
        pedido.itens = (registro.itens || []).map(registroItem => {
            const item = {
                ...registroItem.toJSON(),
                produto: registroItem.produtoInfo?.nome ?? null
            };
            delete item.produtoInfo;
            return item;
        });
        return res.status(200).send({ pedido });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar pedido.');
    }
});

router.post('/', async (req, res) => {
    const body = req.body || {};
    const { status = 1, data_pedido = null, id_cliente = null } = body;
    if (![0, 1, false, true].includes(status)) {
        return res.status(400).send({ mensagem: 'Status deve ser 0 ou 1.' });
    }
    if (data_pedido !== null && !validarData(data_pedido)) {
        return res.status(400).send({ mensagem: 'Data do pedido inválida.' });
    }
    if (id_cliente !== null && !validarId(id_cliente)) {
        return res.status(400).send({ mensagem: 'ID do cliente inválido.' });
    }

    try {
        const pedido = await Pedido.create({
            status: Number(status),
            data_pedido,
            id_cliente: id_cliente === null ? null : Number(id_cliente)
        });
        return res.status(201).send({
            mensagem: 'Pedido criado com sucesso.',
            id_pedido: pedido.id_pedido
        });
    } catch (error) {
        return responderErro(res, error, 'Erro ao criar pedido.');
    }
});

router.patch('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }
    const body = req.body || {};
    const permitidos = ['status', 'data_pedido', 'id_cliente'];
    const campos = permitidos.filter(campo => body[campo] !== undefined);
    if (!campos.length) {
        return res.status(400).send({ mensagem: 'Informe um campo válido para atualizar.' });
    }
    if (body.status !== undefined && ![0, 1, false, true].includes(body.status)) {
        return res.status(400).send({ mensagem: 'Status deve ser 0 ou 1.' });
    }
    if (body.data_pedido !== undefined && body.data_pedido !== null &&
        !validarData(body.data_pedido)) {
        return res.status(400).send({ mensagem: 'Data do pedido inválida.' });
    }
    if (body.id_cliente !== undefined && body.id_cliente !== null &&
        !validarId(body.id_cliente)) {
        return res.status(400).send({ mensagem: 'ID do cliente inválido.' });
    }
    const atualizacoes = Object.fromEntries(campos.map(campo => {
        const valor = campo === 'status'
            ? Number(body[campo])
            : campo === 'id_cliente' && body[campo] !== null
                ? Number(body[campo])
                : body[campo];
        return [campo, valor];
    }));

    try {
        const [afetados] = await Pedido.update(atualizacoes, {
            where: { id_pedido: req.params.id }
        });
        if (!afetados) {
            const existe = await Pedido.count({ where: { id_pedido: req.params.id } });
            if (!existe) {
                return res.status(404).send({ mensagem: 'Pedido não encontrado.' });
            }
        }
        return res.status(200).send({ mensagem: 'Pedido atualizado com sucesso.' });
    } catch (error) {
        return responderErro(res, error, 'Erro ao atualizar pedido.');
    }
});

module.exports = router;
