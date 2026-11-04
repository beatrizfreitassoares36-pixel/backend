const express = require('express');
const router = express.Router();
const { Saida, Estoque, sequelize } = require('../models');
const { validarId, validarData, responderErro } = require('./helpers');

router.get('/', async (req, res) => {
    try {
        const saidas = await Saida.findAll({ order: [['id_saida', 'DESC']], raw: true });
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
        const saida = await Saida.findByPk(req.params.id, { raw: true });
        if (!saida) {
            return res.status(404).send({ mensagem: 'Saída não encontrada.' });
        }
        return res.status(200).send({ saida });
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
        const resultado = await sequelize.transaction(async transaction => {
            await Estoque.findOrCreate({
                where: { id_produto: Number(id_produto) },
                defaults: { quantidade: 0 },
                transaction
            });

            const estoque = await Estoque.findOne({
                attributes: ['quantidade'],
                where: { id_produto: Number(id_produto) },
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!estoque || Number(estoque.quantidade) < Number(quantidade)) {
                const error = new Error('Estoque insuficiente.');
                error.statusCode = 409;
                throw error;
            }

            const saida = await Saida.create({
                id_produto: Number(id_produto),
                id_funcionario: Number(id_funcionario),
                quantidade: Number(quantidade),
                valor_unitario: Number(valor_unitario),
                data_saida: data_saida || null,
                destino: destino === null ? null : destino.trim()
            }, { transaction });
            return saida.id_saida;
        });

        return res.status(201).send({
            mensagem: 'Saída registrada com sucesso.',
            id_saida: resultado
        });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).send({ mensagem: error.message });
        }
        return responderErro(res, error, 'Erro ao registrar saída.');
    }
});

module.exports = router;
