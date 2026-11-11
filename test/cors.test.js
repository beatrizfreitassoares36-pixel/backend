const test = require('node:test');
const assert = require('node:assert/strict');

const corsOriginOriginal = process.env.CORS_ORIGIN;
process.env.CORS_ORIGIN = 'http://localhost:5173,https://frontend.example.com';
const app = require('../app');
if (corsOriginOriginal === undefined) {
    delete process.env.CORS_ORIGIN;
} else {
    process.env.CORS_ORIGIN = corsOriginOriginal;
}

test('CORS permite origens configuradas e bloqueia origens não autorizadas', async t => {
    const server = app.listen(0);
    t.after(async () => {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const permitida = await fetch(`${baseUrl}/teste`, {
        headers: { Origin: 'http://localhost:5173' }
    });
    assert.equal(permitida.status, 200);
    assert.equal(
        permitida.headers.get('access-control-allow-origin'),
        'http://localhost:5173'
    );

    const bloqueada = await fetch(`${baseUrl}/teste`, {
        headers: { Origin: 'https://origem-nao-autorizada.example' }
    });
    assert.equal(bloqueada.status, 200);
    assert.equal(bloqueada.headers.get('access-control-allow-origin'), null);

    const preflight = await fetch(`${baseUrl}/categorias`, {
        method: 'OPTIONS',
        headers: {
            Origin: 'https://frontend.example.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization,content-type'
        }
    });
    assert.equal(preflight.status, 204);
    assert.equal(
        preflight.headers.get('access-control-allow-origin'),
        'https://frontend.example.com'
    );
    assert.match(
        preflight.headers.get('access-control-allow-headers'),
        /authorization/i
    );
});
