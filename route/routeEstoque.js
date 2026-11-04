const express = require('express');
const router = express.Router();
const { Estoque, Produto } = require('../models');
const { validarId, responderErro } = require('./helpers');

router.get('/', async (req, res) => {
    try {
        const registros = await Estoque.findAll({
            attributes: ['id_estoque', 'id_produto', 'quantidade', 'estoque_minimo', 'estoque_maximo', 'localizacao'],
            include: [{ model: Produto, as: 'produtoInfo', attributes: ['nome'], required: true }],
            order: [[{ model: Produto, as: 'produtoInfo' }, 'nome', 'ASC']]
        });
        const estoque = registros.map(registro => ({
            ...registro.toJSON(),
            produto: registro.produtoInfo?.nome
        }));
        for (const item of estoque) delete item.produtoInfo;
        return res.status(200).send({ estoque });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar estoque.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    try {
        const registro = await Estoque.findOne({
            attributes: ['id_estoque', 'id_produto', 'quantidade', 'estoque_minimo', 'estoque_maximo', 'localizacao'],
            include: [{ model: Produto, as: 'produtoInfo', attributes: ['nome'], required: true }],
            where: { id_produto: req.params.id }
        });
        if (!registro) {
            return res.status(404).send({ mensagem: 'Estoque do produto não encontrado.' });
        }
        const item = { ...registro.toJSON(), produto: registro.produtoInfo?.nome };
        delete item.produtoInfo;
        return res.status(200).send({ item });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar estoque.');
    }
});

router.patch('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    const body = req.body || {};
    const camposPermitidos = ['estoque_minimo', 'estoque_maximo', 'localizacao'];
    const campos = camposPermitidos.filter(campo => body[campo] !== undefined);
    if (!campos.length) {
        return res.status(400).send({ mensagem: 'Informe limites ou localização para atualizar.' });
    }

    for (const campo of ['estoque_minimo', 'estoque_maximo']) {
        if (body[campo] !== undefined && body[campo] !== null &&
            (!Number.isInteger(Number(body[campo])) || Number(body[campo]) < 0)) {
            return res.status(400).send({ mensagem: `${campo} deve ser um inteiro não negativo ou nulo.` });
        }
    }
    if (body.localizacao !== undefined && body.localizacao !== null &&
        typeof body.localizacao !== 'string') {
        return res.status(400).send({ mensagem: 'Localização inválida.' });
    }

    try {
        const [afetados] = await Estoque.update(
            Object.fromEntries(campos.map(campo => [campo, body[campo]])),
            { where: { id_produto: req.params.id } }
        );
        if (!afetados) {
            return res.status(404).send({ mensagem: 'Estoque do produto não encontrado.' });
        }
        return res.status(200).send({ mensagem: 'Estoque atualizado com sucesso.' });
    } catch (error) {
        return responderErro(res, error, 'Erro ao atualizar estoque.');
    }
});

module.exports = router;
