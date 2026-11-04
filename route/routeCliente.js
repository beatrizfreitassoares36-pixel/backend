const express = require('express');
const router = express.Router();
const { Cliente } = require('../models');

const camposPermitidos = ['nome', 'email', 'contato'];

function validarId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

function emailValido(email) {
    return typeof email === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function tratarErro(res, error, mensagem) {
    if ((error.original?.code || error.code) === 'ER_DUP_ENTRY') {
        return res.status(409).send({ mensagem: 'Este email já está cadastrado.' });
    }
    console.error(mensagem, error);
    return res.status(500).send({ mensagem });
}

router.get('/', async (req, res) => {
    try {
        const clientes = await Cliente.findAll({
            attributes: ['id_cliente', 'nome', 'email', 'contato', 'ativo', 'criado_em', 'atualizado_em'],
            where: { ativo: true },
            raw: true
        });
        return res.status(200).send({ clientes });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao buscar clientes.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }
    try {
        const cliente = await Cliente.findOne({
            attributes: ['id_cliente', 'nome', 'email', 'contato', 'ativo', 'criado_em', 'atualizado_em'],
            where: { id_cliente: req.params.id, ativo: true },
            raw: true
        });
        if (!cliente) {
            return res.status(404).send({ mensagem: 'Cliente não encontrado.' });
        }
        return res.status(200).send({ cliente });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao buscar cliente.');
    }
});

router.post('/', async (req, res) => {
    const { nome, email, contato = null } = req.body || {};
    if (typeof nome !== 'string' || !nome.trim() || !emailValido(email)) {
        return res.status(400).send({ mensagem: 'Informe o nome e um email válido.' });
    }
    if (contato !== null && typeof contato !== 'string') {
        return res.status(400).send({ mensagem: 'Contato inválido.' });
    }
    try {
        const cliente = await Cliente.create({
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            contato,
            ativo: true
        });
        return res.status(201).send({
            mensagem: 'Cliente cadastrado com sucesso.',
            id_cliente: cliente.id_cliente
        });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao cadastrar cliente.');
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
        return res.status(400).send({ mensagem: 'Nome inválido.' });
    }
    if (body.email !== undefined && !emailValido(body.email)) {
        return res.status(400).send({ mensagem: 'Email inválido.' });
    }
    if (body.contato !== undefined && body.contato !== null &&
        typeof body.contato !== 'string') {
        return res.status(400).send({ mensagem: 'Contato inválido.' });
    }

    const atualizacoes = Object.fromEntries(campos.map(campo => {
        const valor = body[campo];
        const normalizado = typeof valor === 'string' ? valor.trim() : valor;
        return [campo, campo === 'email' && normalizado ? normalizado.toLowerCase() : normalizado];
    }));
    try {
        const [afetados] = await Cliente.update(atualizacoes, {
            where: { id_cliente: req.params.id, ativo: true }
        });
        if (!afetados) {
            return res.status(404).send({ mensagem: 'Cliente não encontrado.' });
        }
        return res.status(200).send({ mensagem: 'Cliente atualizado com sucesso.' });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao atualizar cliente.');
    }
});

router.delete('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }
    try {
        const [afetados] = await Cliente.update(
            { ativo: false },
            { where: { id_cliente: req.params.id, ativo: true } }
        );
        if (!afetados) {
            return res.status(404).send({ mensagem: 'Cliente não encontrado.' });
        }
        return res.status(200).send({ mensagem: 'Cliente desativado com sucesso.' });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao desativar cliente.');
    }
});

module.exports = router;
