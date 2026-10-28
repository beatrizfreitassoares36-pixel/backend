const express = require('express');
const router = express.Router();
const mysql = require('../mysql');

const camposPermitidos = ['nome', 'cargo', 'salario', 'telefone', 'email', 'data_admissao'];

function validarId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

function validarData(data) {
    if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return false;
    }

    const [ano, mes, dia] = data.split('-').map(Number);
    const dataValidada = new Date(Date.UTC(ano, mes - 1, dia));
    return dataValidada.getUTCFullYear() === ano &&
        dataValidada.getUTCMonth() === mes - 1 &&
        dataValidada.getUTCDate() === dia;
}

// LISTAR FUNCIONÁRIOS
router.get('/', (req, res) => {
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            `SELECT id_funcionario, nome, cargo, salario, telefone, email,
                    data_admissao, ativo, criado_em, atualizado_em
             FROM funcionarios WHERE ativo = 1`,
            (error, resultado) => {
                conn.release();

                if (error) {
                    return res.status(500).send({ mensagem: 'Erro ao buscar funcionários.' });
                }

                return res.status(200).send({ funcionarios: resultado });
            }
        );
    });
});

// BUSCAR FUNCIONÁRIO POR ID
router.get('/:id', (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            `SELECT id_funcionario, nome, cargo, salario, telefone, email,
                    data_admissao, ativo, criado_em, atualizado_em
             FROM funcionarios WHERE id_funcionario = ? AND ativo = 1`,
            [req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    return res.status(500).send({ mensagem: 'Erro ao buscar funcionário.' });
                }

                if (resultado.length === 0) {
                    return res.status(404).send({ mensagem: 'Funcionário não encontrado.' });
                }

                return res.status(200).send({ funcionario: resultado[0] });
            }
        );
    });
});

// CADASTRAR FUNCIONÁRIO
router.post('/', (req, res) => {
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

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            `INSERT INTO funcionarios
             (nome, cargo, salario, telefone, email, data_admissao, ativo)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [
                nome.trim(),
                cargo.trim(),
                Number(salario),
                telefone || null,
                email || null,
                data_admissao || null
            ],
            (error, resultado) => {
                conn.release();

                if (error) {
                    return res.status(500).send({ mensagem: 'Erro ao cadastrar funcionário.' });
                }

                return res.status(201).send({
                    mensagem: 'Funcionário cadastrado com sucesso.',
                    id_funcionario: resultado.insertId
                });
            }
        );
    });
});

// ATUALIZAR FUNCIONÁRIO
router.patch('/:id', (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    const body = req.body || {};
    const campos = camposPermitidos.filter(campo => body[campo] !== undefined);

    if (campos.length === 0) {
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

    const valores = campos.map(campo => {
        const valor = body[campo];
        if (campo === 'salario') return Number(valor);
        return typeof valor === 'string' ? valor.trim() : valor;
    });
    const atualizacoes = campos.map(campo => `${campo} = ?`).join(', ');

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            `UPDATE funcionarios
             SET ${atualizacoes}
             WHERE id_funcionario = ? AND ativo = 1`,
            [...valores, req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    return res.status(500).send({ mensagem: 'Erro ao atualizar funcionário.' });
                }

                if (resultado.affectedRows === 0) {
                    return res.status(404).send({ mensagem: 'Funcionário não encontrado.' });
                }

                return res.status(200).send({ mensagem: 'Funcionário atualizado com sucesso.' });
            }
        );
    });
});

// EXCLUIR FUNCIONÁRIO (EXCLUSÃO LÓGICA)
router.delete('/:id', (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({ mensagem: 'Erro ao conectar ao banco de dados.' });
        }

        conn.query(
            'UPDATE funcionarios SET ativo = 0 WHERE id_funcionario = ? AND ativo = 1',
            [req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    return res.status(500).send({ mensagem: 'Erro ao desativar funcionário.' });
                }

                if (resultado.affectedRows === 0) {
                    return res.status(404).send({ mensagem: 'Funcionário não encontrado.' });
                }

                return res.status(200).send({ mensagem: 'Funcionário desativado com sucesso.' });
            }
        );
    });
});

module.exports = router;