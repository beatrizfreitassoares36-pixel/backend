const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { Usuario } = require('../models');

const segredoTeste = 'segredo-de-teste-para-login';
const senhaHash = bcrypt.hashSync('senha-segura', 4);
const usuario = {
    id_usu: 42,
    nome: 'Usuário de teste',
    email: 'teste@example.com',
    senha: senhaHash
};

async function postarLogin(t, corpo, resultado, segredo = segredoTeste) {
    const findOneOriginal = Usuario.findOne;
    const segredoOriginal = process.env.JWT_SECRET;
    const consultas = [];

    t.after(() => {
        Usuario.findOne = findOneOriginal;
        if (segredoOriginal === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = segredoOriginal;
        }
    });

    if (segredo === null) {
        delete process.env.JWT_SECRET;
    } else {
        process.env.JWT_SECRET = segredo;
    }

    Usuario.findOne = async options => {
        consultas.push(options);
        return resultado[0] || null;
    };

    const servidor = app.listen(0);
    try {
        const response = await fetch(
            `http://127.0.0.1:${servidor.address().port}/usuario/login`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(corpo)
            }
        );

        return { response, consultas };
    } finally {
        await new Promise((resolve, reject) => {
            servidor.close(erro => erro ? reject(erro) : resolve());
        });
    }
}

test('login válido retorna token JWT e dados públicos do usuário', async t => {
    const { response, consultas } = await postarLogin(
        t,
        { email: ' TESTE@EXAMPLE.COM ', senha: 'senha-segura' },
        [usuario]
    );

    assert.equal(response.status, 200);
    const corpo = await response.json();
    assert.equal(corpo.mensagem, 'Login realizado com sucesso.');
    assert.deepEqual(corpo.usuario, {
        id_usuario: usuario.id_usu,
        nome: usuario.nome,
        email: usuario.email
    });
    assert.equal(Object.hasOwn(corpo.usuario, 'senha'), false);
    assert.equal(jwt.verify(corpo.token, segredoTeste).sub, '42');
    assert.deepEqual(consultas[0].where, {
        email: 'teste@example.com',
        ativo: true
    });
});

test('login rejeita uma senha incorreta', async t => {
    const { response } = await postarLogin(
        t,
        { email: usuario.email, senha: 'senha-errada' },
        [usuario]
    );

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
        mensagem: 'Email ou senha inválidos.'
    });
});

test('login rejeita um usuário inexistente', async t => {
    const { response } = await postarLogin(
        t,
        { email: usuario.email, senha: 'senha-segura' },
        []
    );

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), {
        mensagem: 'Email ou senha inválidos.'
    });
});

test('login rejeita dados inválidos antes de consultar o banco', async t => {
    const { response, consultas } = await postarLogin(
        t,
        { email: 'invalido', senha: 'senha-segura' },
        [usuario]
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
        mensagem: 'Informe um email válido e a senha.'
    });
    assert.equal(consultas.length, 0);
});

test('login retorna erro explícito quando JWT_SECRET não está configurada', async t => {
    const { response, consultas } = await postarLogin(
        t,
        { email: usuario.email, senha: 'senha-segura' },
        [usuario],
        null
    );

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
        mensagem: 'Erro na configuração da autenticação.'
    });
    assert.equal(consultas.length, 0);
});
