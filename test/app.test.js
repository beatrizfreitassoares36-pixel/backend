const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');

test('app disponibiliza endpoint de saúde', async () => {
    const server = app.listen(0);
    try {
        const response = await fetch(`http://127.0.0.1:${server.address().port}/teste`);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { mensagem: 'Tudo OK' });
    } finally {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    }
});
