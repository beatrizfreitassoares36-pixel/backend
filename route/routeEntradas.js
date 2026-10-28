const express = require('express');
const router = express.Router();
const mysql = require('../mysql');

function validarId(id) {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
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

function responderErroBanco(res, error, mensagem) {
    console.error(mensagem, error);

    if (error.code === 'ER_NO_REFERENCED_ROW_2' ||
        error.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).send({
            mensagem: 'O produto ou fornecedor informado não existe.'
        });
    }

    return res.status(500).send({ mensagem });
}

// LISTAR ENTRADAS
router.get('/', (req, res) => {
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                mensagem: 'Erro ao conectar ao banco de dados.'
            });
        }

        conn.query(
            'SELECT * FROM entradas ORDER BY id_entrada DESC',
            (error, resultado) => {
                conn.release();

                if (error) {
                    return responderErroBanco(
                        res,
                        error,
                        'Erro ao buscar entradas.'
                    );
                }

                return res.status(200).send({ entradas: resultado });
            }
        );
    });
});

// BUSCAR ENTRADA POR ID
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
            'SELECT * FROM entradas WHERE id_entrada = ?',
            [req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    return responderErroBanco(
                        res,
                        error,
                        'Erro ao buscar entrada.'
                    );
                }

                if (resultado.length === 0) {
                    return res.status(404).send({
                        mensagem: 'Entrada não encontrada.'
                    });
                }

                return res.status(200).send({ entrada: resultado[0] });
            }
        );
    });
});

// REGISTRAR ENTRADA
router.post('/', (req, res) => {
    const body = req.body || {};
    const {
        id_produto,
        id_fornecedor,
        quantidade,
        valor_unitario,
        data_entrada,
        observacao
    } = body;

    if (!validarId(String(id_produto)) || !validarId(String(id_fornecedor))) {
        return res.status(400).send({
            mensagem: 'Informe IDs válidos para produto e fornecedor.'
        });
    }

    if (!Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0) {
        return res.status(400).send({
            mensagem: 'A quantidade deve ser um número inteiro maior que zero.'
        });
    }

    if (
        valor_unitario === undefined ||
        valor_unitario === null ||
        valor_unitario === '' ||
        !Number.isFinite(Number(valor_unitario)) ||
        Number(valor_unitario) < 0
    ) {
        return res.status(400).send({
            mensagem: 'O valor unitário deve ser um número igual ou maior que zero.'
        });
    }

    if (data_entrada !== undefined && !validarData(data_entrada)) {
        return res.status(400).send({
            mensagem: 'A data deve estar no formato YYYY-MM-DD e ser válida.'
        });
    }

    if (observacao !== undefined &&
        observacao !== null &&
        typeof observacao !== 'string') {
        return res.status(400).send({
            mensagem: 'A observação deve ser um texto.'
        });
    }

    const campos = [
        'id_produto',
        'id_fornecedor',
        'quantidade',
        'valor_unitario'
    ];

    const valores = [
        Number(id_produto),
        Number(id_fornecedor),
        Number(quantidade),
        Number(valor_unitario)
    ];

    if (data_entrada !== undefined) {
        campos.push('data_entrada');
        valores.push(data_entrada);
    }

    if (observacao !== undefined) {
        campos.push('observacao');
        valores.push(observacao);
    }

    const placeholders = campos.map(() => '?').join(', ');

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                mensagem: 'Erro ao conectar ao banco de dados.'
            });
        }

        conn.query(
            `INSERT INTO entradas (${campos.join(', ')})
             VALUES (${placeholders})`,
            valores,
            (error, resultado) => {
                conn.release();

                if (error) {
                    return responderErroBanco(
                        res,
                        error,
                        'Erro ao registrar entrada.'
                    );
                }

                return res.status(201).send({
                    mensagem: 'Entrada registrada com sucesso.',
                    id_entrada: resultado.insertId
                });
            }
        );
    });
});

module.exports = router;