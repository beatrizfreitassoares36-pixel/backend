const express = require('express');
const router = express.Router();
const { query, transaction, validarId, validarData, responderErro } = require('./helpers');

router.get('/', async (req, res) => {
    try {
        const saidas = await query(
            'SELECT * FROM saidas ORDER BY id_saida DESC'
        );
        return res.status(200).send({ saidas });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar saídas.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    try {
        const resultado = await query(
            'SELECT * FROM saidas WHERE id_saida = ?',
            [req.params.id]
        );
        if (!resultado.length) {
            return res.status(404).send({ mensagem: 'Saída não encontrada.' });
        }
        return res.status(200).send({ saida: resultado[0] });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar saída.');
    }
});

router.post('/', async (req, res) => {
    const body = req.body || {};
    const { id_produto, id_funcionario, quantidade, valor_unitario, data_saida, destino = null } = body;

    if (!validarId(id_produto) || !validarId(id_funcionario)) {
        return res.status(400).send({ mensagem: 'Informe IDs válidos para produto e funcionário.' });
    }
    if (!Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0) {
        return res.status(400).send({ mensagem: 'A quantidade deve ser um inteiro maior que zero.' });
    }
    if (valor_unitario === undefined || valor_unitario === null || valor_unitario === '' ||
        !Number.isFinite(Number(valor_unitario)) || Number(valor_unitario) < 0) {
        return res.status(400).send({ mensagem: 'O valor unitário deve ser maior ou igual a zero.' });
    }
    if (data_saida !== undefined && data_saida !== null && !validarData(data_saida)) {
        return res.status(400).send({ mensagem: 'A data deve ser válida e usar o formato YYYY-MM-DD.' });
    }
    if (destino !== null && typeof destino !== 'string') {
        return res.status(400).send({ mensagem: 'Destino inválido.' });
    }

    try {
        const resultado = await transaction(async connection => {
            await connection.query(
                `INSERT INTO estoque (id_produto, quantidade)
                 VALUES (?, 0)
                 ON DUPLICATE KEY UPDATE id_produto = VALUES(id_produto)`,
                [Number(id_produto)]
            );

            const estoque = await connection.query(
                'SELECT quantidade FROM estoque WHERE id_produto = ? FOR UPDATE',
                [Number(id_produto)]
            );
            if (!estoque.length || estoque[0].quantidade < Number(quantidade)) {
                const error = new Error('Estoque insuficiente.');
                error.statusCode = 409;
                throw error;
            }

            return connection.query(
                `INSERT INTO saidas
                 (id_produto, id_funcionario, quantidade, valor_unitario, data_saida, destino)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    Number(id_produto),
                    Number(id_funcionario),
                    Number(quantidade),
                    Number(valor_unitario),
                    data_saida || null,
                    destino === null ? null : destino.trim()
                ]
            );
        });

        return res.status(201).send({
            mensagem: 'Saída registrada com sucesso.',
            id_saida: resultado.insertId
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).send({ mensagem: error.message });
        }
        return responderErro(res, error, 'Erro ao registrar saída.');
    }
});

module.exports = router;
