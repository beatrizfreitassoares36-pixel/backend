const express = require('express');
const router = express.Router();
const { query, validarId, responderErro } = require('./helpers');

function validarItem(body) {
    return Number.isInteger(Number(body.quantidade)) &&
        Number(body.quantidade) > 0 &&
        Number.isFinite(Number(body.valor_unitario)) &&
        Number(body.valor_unitario) >= 0;
}

router.get('/', async (req, res) => {
    try {
        const itens = await query(
            `SELECT i.id_item, i.id_pedido, i.id_produto, p.nome AS produto,
                    i.quantidade, i.valor_unitario, i.subtotal
             FROM pedido_itens i
             LEFT JOIN produtos p ON p.id_produto = i.id_produto
             ORDER BY i.id_item DESC`
        );
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
        const itens = await query(
            `SELECT i.id_item, i.id_pedido, i.id_produto, p.nome AS produto,
                    i.quantidade, i.valor_unitario, i.subtotal
             FROM pedido_itens i
             LEFT JOIN produtos p ON p.id_produto = i.id_produto
             WHERE i.id_item = ?`,
            [req.params.id]
        );
        if (!itens.length) {
            return res.status(404).send({ mensagem: 'Item do pedido não encontrado.' });
        }
        return res.status(200).send({ item: itens[0] });
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
        const result = await query(
            `INSERT INTO pedido_itens
             (id_pedido, id_produto, quantidade, valor_unitario, subtotal)
             VALUES (?, ?, ?, ?, ?)`,
            [
                Number(body.id_pedido),
                Number(body.id_produto),
                Number(body.quantidade),
                Number(body.valor_unitario),
                subtotal
            ]
        );
        return res.status(201).send({
            mensagem: 'Item adicionado ao pedido.',
            id_item: result.insertId,
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
    const current = await query(
        'SELECT quantidade, valor_unitario FROM pedido_itens WHERE id_item = ?',
        [req.params.id]
    ).catch(error => {
        responderErro(res, error, 'Erro ao buscar item do pedido.');
        return null;
    });
    if (!current) return;
    if (!current.length) {
        return res.status(404).send({ mensagem: 'Item do pedido não encontrado.' });
    }

    const updated = { ...current[0], ...body };
    if (!validarItem(updated)) {
        return res.status(400).send({ mensagem: 'Quantidade e valor unitário devem ser válidos.' });
    }
    const subtotal = Number((Number(updated.quantidade) * Number(updated.valor_unitario)).toFixed(2));
    try {
        await query(
            `UPDATE pedido_itens
             SET ${campos.map(campo => `${campo} = ?`).join(', ')}, subtotal = ?
             WHERE id_item = ?`,
            [...campos.map(campo => Number(body[campo])), subtotal, req.params.id]
        );
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
        const result = await query('DELETE FROM pedido_itens WHERE id_item = ?', [req.params.id]);
        if (!result.affectedRows) {
            return res.status(404).send({ mensagem: 'Item do pedido não encontrado.' });
        }
        return res.status(200).send({ mensagem: 'Item removido do pedido.' });
    } catch (error) {
        return responderErro(res, error, 'Erro ao remover item do pedido.');
    }
});

module.exports = router;
