const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { Usuario } = require('../models');

function validarId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

function emailValido(email) {
    return typeof email === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function responderErro(res, erro, mensagem) {
    console.error(mensagem, erro);

    if ((erro.original?.code || erro.code) === 'ER_DUP_ENTRY') {
        return res.status(409).send({ mensagem: 'Este email já está cadastrado.' });
    }

    return res.status(500).send({ mensagem });
}

// LISTAR USUÁRIOS — nunca seleciona a coluna senha
router.get('/', async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: [['id_usu', 'id_usuario'], 'nome', 'email', 'contato', 'genero', 'ativo'],
            where: { ativo: true },
            raw: true
        });

        return res.status(200).send({ usuarios });
    } catch (erro) {
        return responderErro(res, erro, 'Erro ao buscar usuários.');
    }
});

// BUSCAR USUÁRIO POR ID
router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    try {
        const usuario = await Usuario.findOne({
            attributes: [['id_usu', 'id_usuario'], 'nome', 'email', 'contato', 'genero', 'ativo'],
            where: { id_usu: req.params.id, ativo: true },
            raw: true
        });

        if (!usuario) {
            return res.status(404).send({ mensagem: 'Usuário não encontrado.' });
        }

        return res.status(200).send({ usuario });
    } catch (erro) {
        return responderErro(res, erro, 'Erro ao buscar usuário.');
    }
});

// CADASTRAR USUÁRIO
router.post('/', async (req, res) => {
    const body = req.body || {};
    const { nome, email, senha, contato = null, genero = null } = body;

    if (
        typeof nome !== 'string' || !nome.trim() ||
        !emailValido(email) ||
        typeof senha !== 'string' || senha.length < 8
    ) {
        return res.status(400).send({
            mensagem: 'Informe nome, email válido e senha com pelo menos 8 caracteres.'
        });
    }

    if (contato !== null && typeof contato !== 'string') {
        return res.status(400).send({ mensagem: 'Contato inválido.' });
    }

    if (genero !== null && typeof genero !== 'string') {
        return res.status(400).send({ mensagem: 'Gênero inválido.' });
    }

    try {
        const senhaHash = await bcrypt.hash(senha, 12);

        const usuario = await Usuario.create({
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            senha: senhaHash,
            contato,
            genero,
            ativo: true
        });

        return res.status(201).send({
            mensagem: 'Usuário criado com sucesso.',
            id_usuario: usuario.id_usu
        });
    } catch (erro) {
        return responderErro(res, erro, 'Erro ao cadastrar usuário.');
    }
});

// ATUALIZAR USUÁRIO
router.patch('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    const body = req.body || {};
    const camposPermitidos = ['nome', 'email', 'senha', 'contato', 'genero'];
    const campos = camposPermitidos.filter(campo => body[campo] !== undefined);

    if (campos.length === 0) {
        return res.status(400).send({
            mensagem: 'Informe ao menos um campo válido para atualizar.'
        });
    }

    if (body.nome !== undefined &&
        (typeof body.nome !== 'string' || !body.nome.trim())) {
        return res.status(400).send({ mensagem: 'Nome inválido.' });
    }

    if (body.email !== undefined && !emailValido(body.email)) {
        return res.status(400).send({ mensagem: 'Email inválido.' });
    }

    if (body.senha !== undefined &&
        (typeof body.senha !== 'string' || body.senha.length < 8)) {
        return res.status(400).send({
            mensagem: 'A senha deve ter pelo menos 8 caracteres.'
        });
    }

    if (body.contato !== undefined && body.contato !== null &&
        typeof body.contato !== 'string') {
        return res.status(400).send({ mensagem: 'Contato inválido.' });
    }

    if (body.genero !== undefined && body.genero !== null &&
        typeof body.genero !== 'string') {
        return res.status(400).send({ mensagem: 'Gênero inválido.' });
    }

    try {
        const valores = [];

        for (const campo of campos) {
            let valor = body[campo];

            if (campo === 'nome') valor = valor.trim();
            if (campo === 'email') valor = valor.trim().toLowerCase();
            if (campo === 'senha') valor = await bcrypt.hash(valor, 12);

            valores.push(valor);
        }

        const atualizacoes = Object.fromEntries(campos.map((campo, index) => [campo, valores[index]]));
        const [afetados] = await Usuario.update(atualizacoes, {
            where: { id_usu: req.params.id, ativo: true }
        });

        if (afetados === 0) {
            return res.status(404).send({ mensagem: 'Usuário não encontrado.' });
        }

        return res.status(200).send({ mensagem: 'Usuário atualizado com sucesso.' });
    } catch (erro) {
        return responderErro(res, erro, 'Erro ao atualizar usuário.');
    }
});

// REMOVER USUÁRIO — exclusão lógica
router.delete('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    try {
        const [afetados] = await Usuario.update(
            { ativo: false },
            { where: { id_usu: req.params.id, ativo: true } }
        );

        if (afetados === 0) {
            return res.status(404).send({ mensagem: 'Usuário não encontrado.' });
        }

        return res.status(200).send({ mensagem: 'Usuário desativado com sucesso.' });
    } catch (erro) {
        return responderErro(res, erro, 'Erro ao desativar usuário.');
    }
});

module.exports = router;