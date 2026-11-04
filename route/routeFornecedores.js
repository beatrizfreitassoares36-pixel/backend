const express = require('express');
const router = express.Router();
const { Fornecedor } = require('../models');

const camposPermitidos = ['nome', 'empresa', 'email', 'telefone', 'cidade', 'estado'];
const atributos = [
    'id_fornecedor', 'nome', 'empresa', 'email', 'telefone',
    'cidade', 'estado', 'ativo'
];

function validarId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

function emailValido(email) {
    return typeof email === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function tratarErro(res, error, mensagem) {
    if ((error.original?.code || error.code) === 'ER_DUP_ENTRY') {
        return res.status(409).send({ mensagem: 'Já existe um fornecedor com esses dados.' });
    }
    console.error(mensagem, error);
    return res.status(500).send({ mensagem });
}

router.get('/', async (req, res) => {
    try {
        const fornecedores = await Fornecedor.findAll({
            attributes: atributos,
            where: { ativo: true },
            raw: true
        });
        return res.status(200).send({ fornecedores });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao buscar fornecedores.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) return res.status(400).send({ mensagem: 'ID inválido.' });
    try {
        const fornecedor = await Fornecedor.findOne({
            attributes: atributos,
            where: { id_fornecedor: req.params.id, ativo: true },
            raw: true
        });
        if (!fornecedor) return res.status(404).send({ mensagem: 'Fornecedor não encontrado.' });
        return res.status(200).send({ fornecedor });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao buscar fornecedor.');
    }
});

router.post('/', async (req, res) => {
    const body = req.body || {};
    const { nome, empresa = null, email = null, telefone = null, cidade = null, estado = null } = body;
    if (typeof nome !== 'string' || !nome.trim()) {
        return res.status(400).send({ mensagem: 'Informe o nome do fornecedor.' });
    }
    if (email !== null && !emailValido(email)) {
        return res.status(400).send({ mensagem: 'Email inválido.' });
    }
    for (const [campo, valor] of Object.entries({ empresa, telefone, cidade, estado })) {
        if (valor !== null && typeof valor !== 'string') {
            return res.status(400).send({ mensagem: `${campo} inválido.` });
        }
    }
    try {
        const fornecedor = await Fornecedor.create({
            nome: nome.trim(),
            empresa,
            email: email === null ? null : email.trim().toLowerCase(),
            telefone,
            cidade,
            estado,
            ativo: true
        });
        return res.status(201).send({
            mensagem: 'Fornecedor cadastrado com sucesso.',
            id_fornecedor: fornecedor.id_fornecedor
        });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao cadastrar fornecedor.');
    }
});

router.patch('/:id', async (req, res) => {
    if (!validarId(req.params.id)) return res.status(400).send({ mensagem: 'ID inválido.' });
    const body = req.body || {};
    const campos = camposPermitidos.filter(campo => body[campo] !== undefined);
    if (!campos.length) {
        return res.status(400).send({ mensagem: 'Informe ao menos um campo válido para atualizar.' });
    }
    if (body.nome !== undefined &&
        (typeof body.nome !== 'string' || !body.nome.trim())) {
        return res.status(400).send({ mensagem: 'Nome inválido.' });
    }
    if (body.email !== undefined && body.email !== null && !emailValido(body.email)) {
        return res.status(400).send({ mensagem: 'Email inválido.' });
    }
    for (const campo of ['empresa', 'telefone', 'cidade', 'estado']) {
        if (body[campo] !== undefined && body[campo] !== null &&
            typeof body[campo] !== 'string') {
            return res.status(400).send({ mensagem: `${campo} inválido.` });
        }
    }
    const atualizacoes = Object.fromEntries(campos.map(campo => {
        const valor = body[campo];
        const normalizado = typeof valor === 'string' ? valor.trim() : valor;
        return [campo, campo === 'email' && normalizado ? normalizado.toLowerCase() : normalizado];
    }));
    try {
        const [afetados] = await Fornecedor.update(atualizacoes, {
            where: { id_fornecedor: req.params.id, ativo: true }
        });
        if (!afetados) return res.status(404).send({ mensagem: 'Fornecedor não encontrado.' });
        return res.status(200).send({ mensagem: 'Fornecedor atualizado com sucesso.' });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao atualizar fornecedor.');
    }
});

router.delete('/:id', async (req, res) => {
    if (!validarId(req.params.id)) return res.status(400).send({ mensagem: 'ID inválido.' });
    try {
        const [afetados] = await Fornecedor.update(
            { ativo: false },
            { where: { id_fornecedor: req.params.id, ativo: true } }
        );
        if (!afetados) return res.status(404).send({ mensagem: 'Fornecedor não encontrado.' });
        return res.status(200).send({ mensagem: 'Fornecedor desativado com sucesso.' });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao desativar fornecedor.');
    }
});

module.exports = router;
