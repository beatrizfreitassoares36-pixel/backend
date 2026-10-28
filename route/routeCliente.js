const express = require('express');
const router = express.Router();
const mysql = require('../mysql');

const camposPermitidos = ['nome', 'email', 'contato'];

function validarId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

function emailValido(email) {
    return typeof email === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// LISTAR CLIENTES
router.get('/', (req, res) => {
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            `SELECT id_cliente, nome, email, contato, ativo, criado_em, atualizado_em
             FROM clientes
             WHERE ativo = 1`,
            (error, resultado) => {
                conn.release();

                if (error) {
                    console.error('Erro ao buscar clientes:', error);
                    return res.status(500).send({ mensagem: 'Erro ao buscar clientes.' });
                }

                return res.status(200).send({ clientes: resultado });
            }
        );
    });
});

// BUSCAR CLIENTE POR ID
router.get('/:id', (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            `SELECT id_cliente, nome, email, contato, ativo, criado_em, atualizado_em
             FROM clientes
             WHERE id_cliente = ? AND ativo = 1`,
            [req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    console.error('Erro ao buscar cliente:', error);
                    return res.status(500).send({ mensagem: 'Erro ao buscar cliente.' });
                }

                if (resultado.length === 0) {
                    return res.status(404).send({ mensagem: 'Cliente não encontrado.' });
                }

                return res.status(200).send({ cliente: resultado[0] });
            }
        );
    });
});

// CADASTRAR CLIENTE
router.post('/', (req, res) => {
    const { nome, email, contato = null } = req.body || {};

    if (typeof nome !== 'string' || !nome.trim() || !emailValido(email)) {
        return res.status(400).send({
            mensagem: 'Informe o nome e um email válido.'
        });
    }

    if (contato !== null && typeof contato !== 'string') {
        return res.status(400).send({ mensagem: 'Contato inválido.' });
    }

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            `INSERT INTO clientes (nome, email, contato, ativo)
             VALUES (?, ?, ?, 1)`,
            [nome.trim(), email.trim().toLowerCase(), contato],
            (error, resultado) => {
                conn.release();

                if (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        return res.status(409).send({ mensagem: 'Este email já está cadastrado.' });
                    }

                    console.error('Erro ao cadastrar cliente:', error);
                    return res.status(500).send({ mensagem: 'Erro ao cadastrar cliente.' });
                }

                return res.status(201).send({
                    mensagem: 'Cliente cadastrado com sucesso.',
                    id_cliente: resultado.insertId
                });
            }
        );
    });
});

// ATUALIZAR CLIENTE
router.patch('/:id', (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    const body = req.body || {};
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

    if (body.contato !== undefined &&
        body.contato !== null &&
        typeof body.contato !== 'string') {
        return res.status(400).send({ mensagem: 'Contato inválido.' });
    }

    const valores = campos.map(campo => {
        const valor = body[campo];

        if (typeof valor === 'string') {
            const texto = valor.trim();
            return campo === 'email' ? texto.toLowerCase() : texto;
        }

        return valor;
    });

    const atualizacoes = campos.map(campo => `${campo} = ?`).join(', ');

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            `UPDATE clientes
             SET ${atualizacoes}
             WHERE id_cliente = ? AND ativo = 1`,
            [...valores, req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        return res.status(409).send({ mensagem: 'Este email já está cadastrado.' });
                    }

                    console.error('Erro ao atualizar cliente:', error);
                    return res.status(500).send({ mensagem: 'Erro ao atualizar cliente.' });
                }

                if (resultado.affectedRows === 0) {
                    return res.status(404).send({ mensagem: 'Cliente não encontrado.' });
                }

                return res.status(200).send({ mensagem: 'Cliente atualizado com sucesso.' });
            }
        );
    });
});

// EXCLUIR CLIENTE (EXCLUSÃO LÓGICA)
router.delete('/:id', (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            'UPDATE clientes SET ativo = 0 WHERE id_cliente = ? AND ativo = 1',
            [req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    console.error('Erro ao desativar cliente:', error);
                    return res.status(500).send({ mensagem: 'Erro ao desativar cliente.' });
                }

                if (resultado.affectedRows === 0) {
                    return res.status(404).send({ mensagem: 'Cliente não encontrado.' });
                }

                return res.status(200).send({ mensagem: 'Cliente desativado com sucesso.' });
            }
        );
    });
});

module.exports = router;