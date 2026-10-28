const express = require('express');
const router = express.Router();
const mysql = require('../mysql');

const camposPermitidos = ['nome', 'empresa', 'email', 'telefone', 'cidade', 'estado'];

function validarId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

function emailValido(email) {
    return typeof email === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// LISTAR FORNECEDORES ATIVOS
router.get('/', (req, res) => {
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                mensagem: 'Erro ao conectar ao banco de dados.'
            });
        }

        conn.query(
            `SELECT id_fornecedor, nome, empresa, email, telefone, cidade, estado, ativo
             FROM fornecedores
             WHERE ativo = 1`,
            (error, resultado) => {
                conn.release();

                if (error) {
                    console.error('Erro ao buscar fornecedores:', error);
                    return res.status(500).send({
                        mensagem: 'Erro ao buscar fornecedores.'
                    });
                }

                return res.status(200).send({ fornecedores: resultado });
            }
        );
    });
});

// BUSCAR FORNECEDOR POR ID
router.get('/:id', (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                mensagem: 'Erro ao conectar ao banco de dados.'
            });
        }

        conn.query(
            `SELECT id_fornecedor, nome, empresa, email, telefone, cidade, estado, ativo
             FROM fornecedores
             WHERE id_fornecedor = ? AND ativo = 1`,
            [req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    console.error('Erro ao buscar fornecedor:', error);
                    return res.status(500).send({
                        mensagem: 'Erro ao buscar fornecedor.'
                    });
                }

                if (resultado.length === 0) {
                    return res.status(404).send({
                        mensagem: 'Fornecedor não encontrado.'
                    });
                }

                return res.status(200).send({ fornecedor: resultado[0] });
            }
        );
    });
});

// CADASTRAR FORNECEDOR
router.post('/', (req, res) => {
    const body = req.body || {};
    const { nome, empresa = null, email = null, telefone = null, cidade = null, estado = null } = body;

    if (typeof nome !== 'string' || !nome.trim()) {
        return res.status(400).send({
            mensagem: 'Informe o nome do fornecedor.'
        });
    }

    if (email !== null && !emailValido(email)) {
        return res.status(400).send({ mensagem: 'Email inválido.' });
    }

    const camposTexto = { empresa, telefone, cidade, estado };
    for (const [campo, valor] of Object.entries(camposTexto)) {
        if (valor !== null && typeof valor !== 'string') {
            return res.status(400).send({ mensagem: `${campo} inválido.` });
        }
    }

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                mensagem: 'Erro ao conectar ao banco de dados.'
            });
        }

        conn.query(
            `INSERT INTO fornecedores
             (nome, empresa, email, telefone, cidade, estado, ativo)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [
                nome.trim(),
                empresa,
                email === null ? null : email.trim().toLowerCase(),
                telefone,
                cidade,
                estado
            ],
            (error, resultado) => {
                conn.release();

                if (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        return res.status(409).send({
                            mensagem: 'Já existe um fornecedor com esses dados.'
                        });
                    }

                    console.error('Erro ao cadastrar fornecedor:', error);
                    return res.status(500).send({
                        mensagem: 'Erro ao cadastrar fornecedor.'
                    });
                }

                return res.status(201).send({
                    mensagem: 'Fornecedor cadastrado com sucesso.',
                    id_fornecedor: resultado.insertId
                });
            }
        );
    });
});

// ATUALIZAR FORNECEDOR
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

    if (body.email !== undefined &&
        body.email !== null &&
        !emailValido(body.email)) {
        return res.status(400).send({ mensagem: 'Email inválido.' });
    }

    for (const campo of ['empresa', 'telefone', 'cidade', 'estado']) {
        if (body[campo] !== undefined &&
            body[campo] !== null &&
            typeof body[campo] !== 'string') {
            return res.status(400).send({ mensagem: `${campo} inválido.` });
        }
    }

    const valores = campos.map(campo => {
        const valor = body[campo];

        if (typeof valor !== 'string') {
            return valor;
        }

        const texto = valor.trim();
        return campo === 'email' ? texto.toLowerCase() : texto;
    });

    const atualizacoes = campos.map(campo => `${campo} = ?`).join(', ');

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                mensagem: 'Erro ao conectar ao banco de dados.'
            });
        }

        conn.query(
            `UPDATE fornecedores
             SET ${atualizacoes}
             WHERE id_fornecedor = ? AND ativo = 1`,
            [...valores, req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        return res.status(409).send({
                            mensagem: 'Já existe um fornecedor com esses dados.'
                        });
                    }

                    console.error('Erro ao atualizar fornecedor:', error);
                    return res.status(500).send({
                        mensagem: 'Erro ao atualizar fornecedor.'
                    });
                }

                if (resultado.affectedRows === 0) {
                    return res.status(404).send({
                        mensagem: 'Fornecedor não encontrado.'
                    });
                }

                return res.status(200).send({
                    mensagem: 'Fornecedor atualizado com sucesso.'
                });
            }
        );
    });
});

// EXCLUIR FORNECEDOR (EXCLUSÃO LÓGICA)
router.delete('/:id', (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                mensagem: 'Erro ao conectar ao banco de dados.'
            });
        }

        conn.query(
            `UPDATE fornecedores
             SET ativo = 0
             WHERE id_fornecedor = ? AND ativo = 1`,
            [req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    console.error('Erro ao desativar fornecedor:', error);
                    return res.status(500).send({
                        mensagem: 'Erro ao desativar fornecedor.'
                    });
                }

                if (resultado.affectedRows === 0) {
                    return res.status(404).send({
                        mensagem: 'Fornecedor não encontrado.'
                    });
                }

                return res.status(200).send({
                    mensagem: 'Fornecedor desativado com sucesso.'
                });
            }
        );
    });
});

module.exports = router;