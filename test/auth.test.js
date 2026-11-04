const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const app = require('../app');

test('proteger rotas de dados e manter login e saúde públicos', async t => {
    const segredoOriginal = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'segredo-de-teste-para-autorizacao';
    const servidor = app.listen(0);

    t.after(async () => {
        await new Promise((resolve, reject) => {
            servidor.close(error => error ? reject(error) : resolve());
        });
        if (segredoOriginal === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = segredoOriginal;
        }
    });

    const baseUrl = `http://127.0.0.1:${servidor.address().port}`;
    const semToken = await fetch(`${baseUrl}/usuario`);
    assert.equal(semToken.status, 401);
    assert.deepEqual(await semToken.json(), { mensagem: 'Autenticação necessária.' });

    const tokenInvalido = await fetch(`${baseUrl}/usuario`, {
        headers: { Authorization: 'Bearer token-invalido' }
    });
    assert.equal(tokenInvalido.status, 401);
    assert.deepEqual(await tokenInvalido.json(), { mensagem: 'Token inválido ou expirado.' });

    const token = jwt.sign({ sub: '1' }, process.env.JWT_SECRET, { expiresIn: '1m' });
    const autorizado = await fetch(`${baseUrl}/categorias`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });
    assert.equal(autorizado.status, 400);
    assert.deepEqual(await autorizado.json(), { mensagem: 'Informe o nome da categoria.' });

    const saude = await fetch(`${baseUrl}/teste`);
    assert.equal(saude.status, 200);
    assert.deepEqual(await saude.json(), { mensagem: 'Tudo OK' });
});
