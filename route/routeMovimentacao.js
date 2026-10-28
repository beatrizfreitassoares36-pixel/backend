const express = require('express');
const router = express.Router();
const { query, validarId, responderErro } = require('./helpers');

const tiposPermitidos = ['E', 'S', 'A', 'P', 'T'];

router.get('/', async (req, res) => {
    try {
        const movimentacoes = await query(
            `SELECT m.id_movimentacao, m.id_produto, p.nome AS produto,
                    m.tipo, m.quantidade, m.data_movimentacao, m.observacao
             FROM movimentacoes m
             LEFT JOIN produtos p ON p.id_produto = m.id_produto
             ORDER BY m.id_movimentacao DESC`
        );
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
        const resultado = await query(
            `SELECT m.id_movimentacao, m.id_produto, p.nome AS produto,
                    m.tipo, m.quantidade, m.data_movimentacao, m.observacao
             FROM movimentacoes m
             LEFT JOIN produtos p ON p.id_produto = m.id_produto
             WHERE m.id_movimentacao = ?`,
            [req.params.id]
        );
        if (!resultado.length) {
            return res.status(404).send({ mensagem: 'Movimentação não encontrada.' });
        }
        return res.status(200).send({ movimentacao: resultado[0] });
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
        const result = await query(
            `INSERT INTO movimentacoes
             (id_produto, tipo, quantidade, data_movimentacao, observacao)
             VALUES (?, ?, ?, ?, ?)`,
            [
                id_produto === null ? null : Number(id_produto),
                tipo || null,
                quantidade === null ? null : Number(quantidade),
                data_movimentacao,
                observacao
            ]
        );
        return res.status(201).send({
            mensagem: 'Movimentação registrada.',
            id_movimentacao: result.insertId
        });
    } catch (error) {
        return responderErro(res, error, 'Erro ao registrar movimentação.');
    }
});

module.exports = router;
