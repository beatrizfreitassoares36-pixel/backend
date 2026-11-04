const express = require('express');
const router = express.Router();
const { Categoria } = require('../models');

const camposPermitidos = ['nome', 'descricao'];

function validarId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

function tratarErro(res, error, mensagem) {
    console.error(mensagem, error);
    return res.status(500).send({ mensagem });
}

router.get('/', async (req, res) => {
    try {
        const categorias = await Categoria.findAll({
            attributes: ['id_categoria', 'nome', 'descricao', 'ativo'],
            where: { ativo: true },
            raw: true
        });
        return res.status(200).send({ categorias });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao buscar categorias.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }
    try {
        const categoria = await Categoria.findOne({
            attributes: ['id_categoria', 'nome', 'descricao', 'ativo'],
            where: { id_categoria: req.params.id, ativo: true },
            raw: true
        });
        if (!categoria) {
            return res.status(404).send({ mensagem: 'Categoria não encontrada.' });
        }
        return res.status(200).send({ categoria });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao buscar categoria.');
    }
});

router.post('/', async (req, res) => {
    const { nome, descricao = null } = req.body || {};
    if (typeof nome !== 'string' || !nome.trim()) {
        return res.status(400).send({ mensagem: 'Informe o nome da categoria.' });
    }
    if (descricao !== null && typeof descricao !== 'string') {
        return res.status(400).send({ mensagem: 'Descrição inválida.' });
    }

    try {
        const categoria = await Categoria.create({
            nome: nome.trim(),
            descricao: descricao === null ? null : descricao.trim(),
            ativo: true
        });
        return res.status(201).send({
            mensagem: 'Categoria cadastrada com sucesso.',
            id_categoria: categoria.id_categoria
        });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao cadastrar categoria.');
    }
});

router.patch('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }
    const body = req.body || {};
    const campos = camposPermitidos.filter(campo => body[campo] !== undefined);
    if (!campos.length) {
        return res.status(400).send({
            mensagem: 'Informe ao menos um campo válido para atualizar.'
        });
    }
    if (body.nome !== undefined &&
        (typeof body.nome !== 'string' || !body.nome.trim())) {
        return res.status(400).send({ mensagem: 'Nome da categoria inválido.' });
    }
    if (body.descricao !== undefined && body.descricao !== null &&
        typeof body.descricao !== 'string') {
        return res.status(400).send({ mensagem: 'Descrição inválida.' });
    }

    const atualizacoes = Object.fromEntries(campos.map(campo => [
        campo,
        typeof body[campo] === 'string' ? body[campo].trim() : body[campo]
    ]));
    try {
        const [afetados] = await Categoria.update(atualizacoes, {
            where: { id_categoria: req.params.id, ativo: true }
        });
        if (!afetados) {
            return res.status(404).send({ mensagem: 'Categoria não encontrada.' });
        }
        return res.status(200).send({ mensagem: 'Categoria atualizada com sucesso.' });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao atualizar categoria.');
    }
});

router.delete('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }
    try {
        const [afetados] = await Categoria.update(
            { ativo: false },
            { where: { id_categoria: req.params.id, ativo: true } }
        );
        if (!afetados) {
            return res.status(404).send({ mensagem: 'Categoria não encontrada.' });
        }
        return res.status(200).send({ mensagem: 'Categoria desativada com sucesso.' });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao desativar categoria.');
    }
});

module.exports = router;
