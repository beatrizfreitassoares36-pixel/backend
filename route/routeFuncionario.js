const express = require('express');
const router = express.Router();
const { Funcionario } = require('../models');

const camposPermitidos = ['nome', 'cargo', 'salario', 'telefone', 'email', 'data_admissao'];
const atributos = [
    'id_funcionario', 'nome', 'cargo', 'salario', 'telefone', 'email',
    'data_admissao', 'ativo', 'criado_em', 'atualizado_em'
];

function validarId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

function validarData(data) {
    if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
    const [ano, mes, dia] = data.split('-').map(Number);
    const validada = new Date(Date.UTC(ano, mes - 1, dia));
    return validada.getUTCFullYear() === ano &&
        validada.getUTCMonth() === mes - 1 &&
        validada.getUTCDate() === dia;
}

function tratarErro(res, error, mensagem) {
    console.error(mensagem, error);
    return res.status(500).send({ mensagem });
}

router.get('/', async (req, res) => {
    try {
        const funcionarios = await Funcionario.findAll({
            attributes: atributos,
            where: { ativo: true },
            raw: true
        });
        return res.status(200).send({ funcionarios });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao buscar funcionários.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) return res.status(400).send({ mensagem: 'ID inválido.' });
    try {
        const funcionario = await Funcionario.findOne({
            attributes: atributos,
            where: { id_funcionario: req.params.id, ativo: true },
            raw: true
        });
        if (!funcionario) return res.status(404).send({ mensagem: 'Funcionário não encontrado.' });
        return res.status(200).send({ funcionario });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao buscar funcionário.');
    }
});

router.post('/', async (req, res) => {
    const { nome, cargo, salario, telefone, email, data_admissao } = req.body || {};
    if (
        typeof nome !== 'string' || !nome.trim() ||
        typeof cargo !== 'string' || !cargo.trim() ||
        salario === undefined ||
        (telefone !== undefined && telefone !== null && typeof telefone !== 'string') ||
        (email !== undefined && email !== null && typeof email !== 'string') ||
        (data_admissao !== undefined && data_admissao !== null && !validarData(data_admissao))
    ) {
        return res.status(400).send({
            mensagem: 'Informe nome, cargo e salário válidos; os demais campos devem respeitar seus formatos.'
        });
    }
    if (!Number.isFinite(Number(salario)) || Number(salario) < 0) {
        return res.status(400).send({ mensagem: 'Salário inválido.' });
    }
    try {
        const funcionario = await Funcionario.create({
            nome: nome.trim(),
            cargo: cargo.trim(),
            salario: Number(salario),
            telefone: telefone || null,
            email: email || null,
            data_admissao: data_admissao || null,
            ativo: true
        });
        return res.status(201).send({
            mensagem: 'Funcionário cadastrado com sucesso.',
            id_funcionario: funcionario.id_funcionario
        });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao cadastrar funcionário.');
    }
});

router.patch('/:id', async (req, res) => {
    if (!validarId(req.params.id)) return res.status(400).send({ mensagem: 'ID inválido.' });
    const body = req.body || {};
    const campos = camposPermitidos.filter(campo => body[campo] !== undefined);
    if (!campos.length) {
        return res.status(400).send({ mensagem: 'Informe ao menos um campo válido para atualizar.' });
    }
    if (body.salario !== undefined &&
        (!Number.isFinite(Number(body.salario)) || Number(body.salario) < 0)) {
        return res.status(400).send({ mensagem: 'Salário inválido.' });
    }
    for (const campo of ['nome', 'cargo']) {
        if (body[campo] !== undefined &&
            (typeof body[campo] !== 'string' || !body[campo].trim())) {
            return res.status(400).send({ mensagem: `${campo} inválido.` });
        }
    }
    for (const campo of ['telefone', 'email']) {
        if (body[campo] !== undefined && body[campo] !== null &&
            typeof body[campo] !== 'string') {
            return res.status(400).send({ mensagem: `${campo} inválido.` });
        }
    }
    if (body.data_admissao !== undefined && body.data_admissao !== null &&
        !validarData(body.data_admissao)) {
        return res.status(400).send({ mensagem: 'Data de admissão inválida.' });
    }

    const atualizacoes = Object.fromEntries(campos.map(campo => {
        const valor = body[campo];
        return [campo, campo === 'salario' ? Number(valor) :
            typeof valor === 'string' ? valor.trim() : valor];
    }));
    try {
        const [afetados] = await Funcionario.update(atualizacoes, {
            where: { id_funcionario: req.params.id, ativo: true }
        });
        if (!afetados) return res.status(404).send({ mensagem: 'Funcionário não encontrado.' });
        return res.status(200).send({ mensagem: 'Funcionário atualizado com sucesso.' });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao atualizar funcionário.');
    }
});

router.delete('/:id', async (req, res) => {
    if (!validarId(req.params.id)) return res.status(400).send({ mensagem: 'ID inválido.' });
    try {
        const [afetados] = await Funcionario.update(
            { ativo: false },
            { where: { id_funcionario: req.params.id, ativo: true } }
        );
        if (!afetados) return res.status(404).send({ mensagem: 'Funcionário não encontrado.' });
        return res.status(200).send({ mensagem: 'Funcionário desativado com sucesso.' });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao desativar funcionário.');
    }
});

module.exports = router;
