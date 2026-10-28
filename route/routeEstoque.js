const express = require('express');
const router = express.Router();
const { query, validarId, responderErro } = require('./helpers');

router.get('/', async (req, res) => {
    try {
        const estoque = await query(
            `SELECT e.id_estoque, e.id_produto, p.nome AS produto,
                    e.quantidade, e.estoque_minimo, e.estoque_maximo, e.localizacao
             FROM estoque e
             INNER JOIN produtos p ON p.id_produto = e.id_produto
             ORDER BY p.nome`
        );
        return res.status(200).send({ estoque });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar estoque.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    try {
        const resultado = await query(
            `SELECT e.id_estoque, e.id_produto, p.nome AS produto,
                    e.quantidade, e.estoque_minimo, e.estoque_maximo, e.localizacao
             FROM estoque e
             INNER JOIN produtos p ON p.id_produto = e.id_produto
             WHERE e.id_produto = ?`,
            [req.params.id]
        );
        if (!resultado.length) {
            return res.status(404).send({ mensagem: 'Estoque do produto não encontrado.' });
        }
        return res.status(200).send({ item: resultado[0] });
    } catch (error) {
        return responderErro(res, error, 'Erro ao buscar estoque.');
    }
});

router.patch('/:id', async (req, res) => {
    if (!validarId(req.params.id)) {
        return res.status(400).send({ mensagem: 'ID inválido.' });
    }

    const body = req.body || {};
    const camposPermitidos = ['estoque_minimo', 'estoque_maximo', 'localizacao'];
    const campos = camposPermitidos.filter(campo => body[campo] !== undefined);
    if (!campos.length) {
        return res.status(400).send({ mensagem: 'Informe limites ou localização para atualizar.' });
    }

    for (const campo of ['estoque_minimo', 'estoque_maximo']) {
        if (body[campo] !== undefined && body[campo] !== null &&
            (!Number.isInteger(Number(body[campo])) || Number(body[campo]) < 0)) {
            return res.status(400).send({ mensagem: `${campo} deve ser um inteiro não negativo ou nulo.` });
        }
    }
    if (body.localizacao !== undefined && body.localizacao !== null &&
        typeof body.localizacao !== 'string') {
        return res.status(400).send({ mensagem: 'Localização inválida.' });
    }

    try {
        const resultado = await query(
            `UPDATE estoque SET ${campos.map(campo => `${campo} = ?`).join(', ')}
             WHERE id_produto = ?`,
            [...campos.map(campo => body[campo]), req.params.id]
        );
        if (!resultado.affectedRows) {
            return res.status(404).send({ mensagem: 'Estoque do produto não encontrado.' });
        }
        return res.status(200).send({ mensagem: 'Estoque atualizado com sucesso.' });
    } catch (error) {
        return responderErro(res, error, 'Erro ao atualizar estoque.');
    }
});

module.exports = router;
