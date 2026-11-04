const express = require('express');
const router = express.Router();
const { Produto } = require('../models');

const camposPermitidos = ['nome', 'descricao', 'preco', 'imagem_produto', 'id_categoria'];
const atributos = [
    'id_produto', 'nome', 'descricao', 'preco', 'imagem_produto',
    'id_categoria', 'criado_em', 'atualizado_em'
];

function validarId(id) {
    return /^\d+$/.test(id) && Number(id) > 0;
}

function validarPreco(preco) {
    return preco !== null && preco !== '' &&
        Number.isFinite(Number(preco)) && Number(preco) >= 0;
}

function tratarErro(res, error, mensagem) {
    const code = error.original?.code || error.code;
    if (code === 'ER_NO_REFERENCED_ROW_2' || code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).send({ mensagem: 'A categoria informada não existe.' });
    }
    if (code === 'ER_ROW_IS_REFERENCED_2' || code === 'ER_ROW_IS_REFERENCED') {
        return res.status(409).send({
            mensagem: 'Não é possível excluir o produto porque existem registros relacionados.'
        });
    }
    console.error(mensagem, error);
    return res.status(500).send({ mensagem });
}

router.get('/', async (req, res) => {
    try {
        const produtos = await Produto.findAll({
            attributes: atributos,
            order: [['id_produto', 'DESC']],
            raw: true
        });
        return res.status(200).send({ produtos });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao buscar produtos.');
    }
});

router.get('/:id', async (req, res) => {
    if (!validarId(req.params.id)) return res.status(400).send({ mensagem: 'ID inválido.' });
    try {
        const produto = await Produto.findByPk(req.params.id, { attributes: atributos, raw: true });
        if (!produto) return res.status(404).send({ mensagem: 'Produto não encontrado.' });
        return res.status(200).send({ produto });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao buscar produto.');
    }
});

router.post('/', async (req, res) => {
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
    if (!validarPreco(preco)) return res.status(400).send({ mensagem: 'Preço inválido.' });
    if (descricao !== null && typeof descricao !== 'string') {
        return res.status(400).send({ mensagem: 'Descrição inválida.' });
    }
    if (imagem_produto !== null && typeof imagem_produto !== 'string') {
        return res.status(400).send({ mensagem: 'Imagem do produto inválida.' });
    }
    if (id_categoria !== null &&
        (!/^\d+$/.test(String(id_categoria)) || Number(id_categoria) <= 0)) {
        return res.status(400).send({ mensagem: 'ID da categoria inválido.' });
    }
    try {
        const produto = await Produto.create({
            nome: nome.trim(),
            descricao: descricao === null ? '' : descricao.trim(),
            preco: Number(preco),
            imagem_produto: imagem_produto === null ? '' : imagem_produto,
            id_categoria: id_categoria === null ? null : Number(id_categoria)
        });
        return res.status(201).send({
            mensagem: 'Produto cadastrado com sucesso.',
            id_produto: produto.id_produto
        });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao cadastrar produto.');
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
        return res.status(400).send({ mensagem: 'Nome do produto inválido.' });
    }
    if (body.preco !== undefined && !validarPreco(body.preco)) {
        return res.status(400).send({ mensagem: 'Preço inválido.' });
    }
    if (body.descricao !== undefined && body.descricao !== null &&
        typeof body.descricao !== 'string') {
        return res.status(400).send({ mensagem: 'Descrição inválida.' });
    }
    if (body.imagem_produto !== undefined && body.imagem_produto !== null &&
        typeof body.imagem_produto !== 'string') {
        return res.status(400).send({ mensagem: 'Imagem do produto inválida.' });
    }
    if (body.id_categoria !== undefined && body.id_categoria !== null &&
        (!/^\d+$/.test(String(body.id_categoria)) || Number(body.id_categoria) <= 0)) {
        return res.status(400).send({ mensagem: 'ID da categoria inválido.' });
    }
    const atualizacoes = Object.fromEntries(campos.map(campo => {
        const valor = body[campo];
        if (campo === 'preco') return [campo, Number(valor)];
        if (campo === 'id_categoria') {
            return [campo, valor === null ? null : Number(valor)];
        }
        if (campo === 'nome') return [campo, valor.trim()];
        if (campo === 'descricao' || campo === 'imagem_produto') {
            return [campo, valor === null ? '' : valor.trim()];
        }
        return [campo, valor];
    }));
    try {
        const [afetados] = await Produto.update(atualizacoes, {
            where: { id_produto: req.params.id }
        });
        if (!afetados) return res.status(404).send({ mensagem: 'Produto não encontrado.' });
        return res.status(200).send({ mensagem: 'Produto atualizado com sucesso.' });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao atualizar produto.');
    }
});

router.delete('/:id', async (req, res) => {
    if (!validarId(req.params.id)) return res.status(400).send({ mensagem: 'ID inválido.' });
    try {
        const removidos = await Produto.destroy({ where: { id_produto: req.params.id } });
        if (!removidos) return res.status(404).send({ mensagem: 'Produto não encontrado.' });
        return res.status(200).send({ mensagem: 'Produto excluído com sucesso.' });
    } catch (error) {
        return tratarErro(res, error, 'Erro ao excluir produto.');
    }
});

module.exports = router;
