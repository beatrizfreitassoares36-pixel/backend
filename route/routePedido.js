const express = require('express');
const router = express.Router();
const { query, validarId, validarData, responderErro } = require('./helpers');

router.get('/', async (req, res) => {
    try {
        const pedidos = await query(
            `SELECT p.id_pedido, p.status, p.data_pedido, p.id_cliente,
                    c.nome AS cliente, p.criado_em, p.atualizado_em
             FROM pedidos p
             LEFT JOIN clientes c ON c.id_cliente = p.id_cliente
             ORDER BY p.id_pedido DESC`
        );
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
        const pedidos = await query(
            `SELECT p.id_pedido, p.status, p.data_pedido, p.id_cliente,
                    c.nome AS cliente, p.criado_em, p.atualizado_em
             FROM pedidos p
             LEFT JOIN clientes c ON c.id_cliente = p.id_cliente
             WHERE p.id_pedido = ?`,
            [req.params.id]
        );
        if (!pedidos.length) {
            return res.status(404).send({ mensagem: 'Pedido não encontrado.' });
        }

        const itens = await query(
            `SELECT i.id_item, i.id_produto, p.nome AS produto, i.quantidade,
                    i.valor_unitario, i.subtotal
             FROM pedido_itens i
             LEFT JOIN produtos p ON p.id_produto = i.id_produto
             WHERE i.id_pedido = ? ORDER BY i.id_item`,
            [req.params.id]
        );
        return res.status(200).send({ pedido: { ...pedidos[0], itens } });
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
        const resultado = await query(
            'INSERT INTO pedidos (status, data_pedido, id_cliente) VALUES (?, ?, ?)',
            [Number(status), data_pedido, id_cliente === null ? null : Number(id_cliente)]
        );
        return res.status(201).send({
            mensagem: 'Pedido criado com sucesso.',
            id_pedido: resultado.insertId
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
    const valores = campos.map(campo => {
        if (campo === 'status') return Number(body[campo]);
        if (campo === 'id_cliente' && body[campo] !== null) return Number(body[campo]);
        return body[campo];
    });

    try {
        const resultado = await query(
            `UPDATE pedidos SET ${campos.map(campo => `${campo} = ?`).join(', ')}
             WHERE id_pedido = ?`,
            [...valores, req.params.id]
        );
        if (!resultado.affectedRows) {
            const exists = await query('SELECT id_pedido FROM pedidos WHERE id_pedido = ?', [req.params.id]);
            if (!exists.length) {
                return res.status(404).send({ mensagem: 'Pedido não encontrado.' });
            }
        }
        return res.status(200).send({ mensagem: 'Pedido atualizado com sucesso.' });
    } catch (error) {
        return responderErro(res, error, 'Erro ao atualizar pedido.');
    }
});

module.exports = router;
