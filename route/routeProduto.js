const express = require('express');
const router = express.Router();
const mysql = require('../mysql');

const camposPermitidos = [
    'nome',
    'descricao',
    'preco',
    'imagem_produto',
    'id_categoria'
];

function validarId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

function validarPreco(preco) {
    return preco !== null &&
        preco !== '' &&
        Number.isFinite(Number(preco)) &&
        Number(preco) >= 0;
}

// LISTAR PRODUTOS
router.get('/', (req, res) => {
    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                mensagem: 'Erro ao conectar ao banco de dados.'
            });
        }

        conn.query(
            `SELECT id_produto, nome, descricao, preco, imagem_produto,
                    id_categoria, criado_em, atualizado_em
             FROM produtos
             ORDER BY id_produto DESC`,
            (error, resultado) => {
                conn.release();

                if (error) {
                    console.error('Erro ao buscar produtos:', error);
                    return res.status(500).send({
                        mensagem: 'Erro ao buscar produtos.'
                    });
                }

                return res.status(200).send({ produtos: resultado });
            }
        );
    });
});

// BUSCAR PRODUTO POR ID
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
            `SELECT id_produto, nome, descricao, preco, imagem_produto,
                    id_categoria, criado_em, atualizado_em
             FROM produtos
             WHERE id_produto = ?`,
            [req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    console.error('Erro ao buscar produto:', error);
                    return res.status(500).send({
                        mensagem: 'Erro ao buscar produto.'
                    });
                }

                if (resultado.length === 0) {
                    return res.status(404).send({
                        mensagem: 'Produto não encontrado.'
                    });
                }

                return res.status(200).send({ produto: resultado[0] });
            }
        );
    });
});

// CADASTRAR PRODUTO
router.post('/', (req, res) => {
    const body = req.body || {};
    const {
        nome,
        descricao = '',
        preco,
        imagem_produto = '',
        id_categoria = null
    } = body;

    if (typeof nome !== 'string' || !nome.trim()) {
        return res.status(400).send({ mensagem: 'Informe o nome do produto.' });
    }

    if (!validarPreco(preco)) {
        return res.status(400).send({ mensagem: 'Preço inválido.' });
    }

    if (descricao !== null && typeof descricao !== 'string') {
        return res.status(400).send({ mensagem: 'Descrição inválida.' });
    }

    if (imagem_produto !== null && typeof imagem_produto !== 'string') {
        return res.status(400).send({ mensagem: 'Imagem do produto inválida.' });
    }

    if (
        id_categoria !== null &&
        (!/^\d+$/.test(String(id_categoria)) || Number(id_categoria) <= 0)
    ) {
        return res.status(400).send({ mensagem: 'ID da categoria inválido.' });
    }

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                mensagem: 'Erro ao conectar ao banco de dados.'
            });
        }

        conn.query(
            `INSERT INTO produtos
             (nome, descricao, preco, imagem_produto, id_categoria)
             VALUES (?, ?, ?, ?, ?)`,
            [
                nome.trim(),
                descricao === null ? '' : descricao.trim(),
                Number(preco),
                imagem_produto === null ? '' : imagem_produto,
                id_categoria
            ],
            (error, resultado) => {
                conn.release();

                if (error) {
                    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                        return res.status(400).send({
                            mensagem: 'A categoria informada não existe.'
                        });
                    }

                    console.error('Erro ao cadastrar produto:', error);
                    return res.status(500).send({
                        mensagem: 'Erro ao cadastrar produto.'
                    });
                }

                return res.status(201).send({
                    mensagem: 'Produto cadastrado com sucesso.',
                    id_produto: resultado.insertId
                });
            }
        );
    });
});

// ATUALIZAR PRODUTO
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

    if (
        body.nome !== undefined &&
        (typeof body.nome !== 'string' || !body.nome.trim())
    ) {
        return res.status(400).send({ mensagem: 'Nome do produto inválido.' });
    }

    if (body.preco !== undefined && !validarPreco(body.preco)) {
        return res.status(400).send({ mensagem: 'Preço inválido.' });
    }

    if (
        body.descricao !== undefined &&
        body.descricao !== null &&
        typeof body.descricao !== 'string'
    ) {
        return res.status(400).send({ mensagem: 'Descrição inválida.' });
    }

    if (
        body.imagem_produto !== undefined &&
        body.imagem_produto !== null &&
        typeof body.imagem_produto !== 'string'
    ) {
        return res.status(400).send({ mensagem: 'Imagem do produto inválida.' });
    }

    if (
        body.id_categoria !== undefined &&
        body.id_categoria !== null &&
        (!/^\d+$/.test(String(body.id_categoria)) || Number(body.id_categoria) <= 0)
    ) {
        return res.status(400).send({ mensagem: 'ID da categoria inválido.' });
    }

    const valores = campos.map(campo => {
        const valor = body[campo];

        if (campo === 'nome' || campo === 'descricao' || campo === 'imagem_produto') {
            return typeof valor === 'string' ? valor.trim() :
                valor === null && (campo === 'descricao' || campo === 'imagem_produto') ? '' : valor;
        }

        if (campo === 'preco') {
            return Number(valor);
        }

        return valor;
    });

    const atualizacoes = campos.map(campo => `${campo} = ?`).join(', ');

    mysql.getConnection((error, conn) => {
        if (error) {
            return res.status(500).send({
                mensagem: 'Erro ao conectar ao banco de dados.'
            });
        }

        conn.query(
            `UPDATE produtos
             SET ${atualizacoes}
             WHERE id_produto = ?`,
            [...valores, req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                        return res.status(400).send({
                            mensagem: 'A categoria informada não existe.'
                        });
                    }

                    console.error('Erro ao atualizar produto:', error);
                    return res.status(500).send({
                        mensagem: 'Erro ao atualizar produto.'
                    });
                }

                if (resultado.affectedRows === 0) {
                    return res.status(404).send({
                        mensagem: 'Produto não encontrado.'
                    });
                }

                return res.status(200).send({
                    mensagem: 'Produto atualizado com sucesso.'
                });
            }
        );
    });
});

// EXCLUIR PRODUTO
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
            'DELETE FROM produtos WHERE id_produto = ?',
            [req.params.id],
            (error, resultado) => {
                conn.release();

                if (error) {
                    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                        return res.status(409).send({
                            mensagem: 'Não é possível excluir o produto porque existem registros relacionados.'
                        });
                    }

                    console.error('Erro ao excluir produto:', error);
                    return res.status(500).send({
                        mensagem: 'Erro ao excluir produto.'
                    });
                }

                if (resultado.affectedRows === 0) {
                    return res.status(404).send({
                        mensagem: 'Produto não encontrado.'
                    });
                }

                return res.status(200).send({
                    mensagem: 'Produto excluído com sucesso.'
                });
            }
        );
    });
});

module.exports = router;