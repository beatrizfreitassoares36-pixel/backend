const express = require('express');
const router = express.Router();
const { query, validarId, validarData, responderErro } = require('./helpers');

router.get('/', async (req, res) => {
    try {
        const historico = await query(
            `SELECT h.id_historico, h.id_produto, p.nome AS produto,
                    h.preco, h.vigencia
             FROM historico_precos h
             LEFT JOIN produtos p ON p.id_produto = h.id_produto
             ORDER BY h.vigencia DESC, h.id_historico DESC`
        );
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
        const resultado = await query(
            `SELECT h.id_historico, h.id_produto, p.nome AS produto,
                    h.preco, h.vigencia
             FROM historico_precos h
             LEFT JOIN produtos p ON p.id_produto = h.id_produto
             WHERE h.id_historico = ?`,
            [req.params.id]
        );
        if (!resultado.length) {
            return res.status(404).send({ mensagem: 'Registro de preço não encontrado.' });
        }
        return res.status(200).send({ registro: resultado[0] });
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
        const result = await query(
            'INSERT INTO historico_precos (id_produto, preco, vigencia) VALUES (?, ?, ?)',
            [Number(id_produto), Number(preco), vigencia]
        );
        return res.status(201).send({
            mensagem: 'Preço registrado no histórico.',
            id_historico: result.insertId
        });
    } catch (error) {
        return responderErro(res, error, 'Erro ao registrar preço.');
    }
});

module.exports = router;
