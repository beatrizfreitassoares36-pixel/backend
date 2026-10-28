const express = require('express');
const router = express.Router();
const { query, validarId, responderErro } = require('./helpers');

router.get('/', async (req, res) => {
    try {
        const logs = await query(
            `SELECT id_log, usuario, tabela_afetada, acao, registro, data_hora
             FROM logs ORDER BY id_log DESC`
        );
        return res.status(200).send({ logs });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar logs.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }
    try {
        const resultado = await query(
            `SELECT id_log, usuario, tabela_afetada, acao, registro, data_hora
             FROM logs WHERE id_log = ?`,
            [req.params.id]
        );
        if (!resultado.length) {
            return res.status(404).send({ mensagem: 'Log não encontrado.' });
        }
        return res.status(200).send({ log: resultado[0] });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar log.');
    }
});

router.post('/', async (req, res) => {
    const body = req.body || {};
    const { usuario = null, tabela_afetada = null, acao = null, registro = null, data_hora = null } = body;
    for (const campo of ['usuario', 'tabela_afetada', 'acao']) {
        if (body[campo] !== undefined && body[campo] !== null &&
            typeof body[campo] !== 'string') {
            return res.status(400).send({ mensagem: `${campo} inválido.` });
        }
    }
    if (registro !== null && !validarId(registro)) {
        return res.status(400).send({ mensagem: 'Número do registro inválido.' });
    }
    if (data_hora !== null &&
        (typeof data_hora !== 'string' || Number.isNaN(Date.parse(data_hora)))) {
        return res.status(400).send({ mensagem: 'Data e hora inválidas.' });
    }

    try {
        const result = await query(
            `INSERT INTO logs (usuario, tabela_afetada, acao, registro, data_hora)
             VALUES (?, ?, ?, ?, ?)`,
            [usuario, tabela_afetada, acao, registro === null ? null : Number(registro), data_hora]
        );
        return res.status(201).send({
            mensagem: 'Log registrado.',
            id_log: result.insertId
        });
    } catch (error) {
        return responderErro(res, error, 'Erro ao registrar log.');
    }
});

module.exports = router;
