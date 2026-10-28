const express = require('express');
const router = express.Router();
const mysql = require('../mysql');

const camposPermitidos = ['nome', 'descricao'];

function validarId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

// LISTAR CATEGORIAS ATIVAS
router.get('/', (req, res) => {
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            `SELECT id_categoria, nome, descricao, ativo
             FROM categorias
             WHERE ativo = 1`,
            (error, resultado) => {
                conn.release();

                if (error) {
                    console.error('Erro ao buscar categorias:', error);
                    return res.status(500).send({ mensagem: 'Erro ao buscar categorias.' });
                }

                return res.status(200).send({ categorias: resultado });
            }
        );
    });
});

// BUSCAR CATEGORIA POR ID
router.get('/:id', (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            `SELECT id_categoria, nome, descricao, ativo
             FROM categorias
             WHERE id_categoria = ? AND ativo = 1`,
            [req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    console.error('Erro ao buscar categoria:', error);
                    return res.status(500).send({ mensagem: 'Erro ao buscar categoria.' });
                }

                if (resultado.length === 0) {
                    return res.status(404).send({ mensagem: 'Categoria não encontrada.' });
                }

                return res.status(200).send({ categoria: resultado[0] });
            }
        );
    });
});

// CADASTRAR CATEGORIA
router.post('/', (req, res) => {
    const { nome, descricao = null } = req.body || {};

    if (typeof nome !== 'string' || !nome.trim()) {
        return res.status(400).send({ mensagem: 'Informe o nome da categoria.' });
    }

    if (descricao !== null && typeof descricao !== 'string') {
        return res.status(400).send({ mensagem: 'Descrição inválida.' });
    }

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            `INSERT INTO categorias (nome, descricao, ativo)
             VALUES (?, ?, 1)`,
            [nome.trim(), descricao === null ? null : descricao.trim()],
            (error, resultado) => {
                conn.release();

                if (error) {
                    console.error('Erro ao cadastrar categoria:', error);
                    return res.status(500).send({ mensagem: 'Erro ao cadastrar categoria.' });
                }

                return res.status(201).send({
                    mensagem: 'Categoria cadastrada com sucesso.',
                    id_categoria: resultado.insertId
                });
            }
        );
    });
});

// ATUALIZAR CATEGORIA
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
        return res.status(400).send({ mensagem: 'Nome da categoria inválido.' });
    }

    if (body.descricao !== undefined &&
        body.descricao !== null &&
        typeof body.descricao !== 'string') {
        return res.status(400).send({ mensagem: 'Descrição inválida.' });
    }

    const valores = campos.map(campo => {
        const valor = body[campo];
        return typeof valor === 'string' ? valor.trim() : valor;
    });

    const atualizacoes = campos.map(campo => `${campo} = ?`).join(', ');

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            `UPDATE categorias
             SET ${atualizacoes}
             WHERE id_categoria = ? AND ativo = 1`,
            [...valores, req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    console.error('Erro ao atualizar categoria:', error);
                    return res.status(500).send({ mensagem: 'Erro ao atualizar categoria.' });
                }

                if (resultado.affectedRows === 0) {
                    return res.status(404).send({ mensagem: 'Categoria não encontrada.' });
                }

                return res.status(200).send({ mensagem: 'Categoria atualizada com sucesso.' });
            }
        );
    });
});

// EXCLUIR CATEGORIA (EXCLUSÃO LÓGICA)
router.delete('/:id', (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            'UPDATE categorias SET ativo = 0 WHERE id_categoria = ? AND ativo = 1',
            [req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    console.error('Erro ao desativar categoria:', error);
                    return res.status(500).send({ mensagem: 'Erro ao desativar categoria.' });
                }

                if (resultado.affectedRows === 0) {
                    return res.status(404).send({ mensagem: 'Categoria não encontrada.' });
                }

                return res.status(200).send({ mensagem: 'Categoria desativada com sucesso.' });
            }
        );
    });
});

module.exports = router;