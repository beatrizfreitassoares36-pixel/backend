const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { responderErro } = require('./helpers');

const router = express.Router();

function emailValido(email) {
    return typeof email === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

router.post('/login', async (req, res) => {
    const { email, senha } = req.body || {};

    if (!emailValido(email) || typeof senha !== 'string' || !senha) {
        return res.status(400).send({
            mensagem: 'Informe um email válido e a senha.'
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET não configurada.');
        return res.status(500).send({ mensagem: 'Erro na configuração da autenticação.' });
    }

    try {
        const usuario = await Usuario.findOne({
            attributes: ['id_usu', 'nome', 'email', 'senha'],
            where: {
                email: email.trim().toLowerCase(),
                ativo: true
            }
        });

        if (!usuario) {
            return res.status(401).send({ mensagem: 'Email ou senha inválidos.' });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).send({ mensagem: 'Email ou senha inválidos.' });
        }

        const token = jwt.sign(
            { sub: String(usuario.id_usu) },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.status(200).send({
            mensagem: 'Login realizado com sucesso.',
            token,
            usuario: {
                id_usuario: usuario.id_usu,
                nome: usuario.nome,
                email: usuario.email
            }
        });
    } catch (erro) {
        return responderErro(res, erro, 'Erro ao realizar login.');
    }
});

module.exports = router;
