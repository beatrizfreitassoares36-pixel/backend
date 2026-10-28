const test = require('node:test');
const assert = require('node:assert/strict');
const { validarId, validarData } = require('../route/helpers');

test('validarId aceita apenas IDs inteiros positivos', () => {
    assert.equal(validarId(1), true);
    assert.equal(validarId('42'), true);
    assert.equal(validarId('0'), false);
    assert.equal(validarId('-1'), false);
    assert.equal(validarId('1.5'), false);
    assert.equal(validarId('abc'), false);
});

test('validarData rejeita datas inexistentes e formatos inválidos', () => {
    assert.equal(validarData('2024-02-29'), true);
    assert.equal(validarData('2025-02-29'), false);
    assert.equal(validarData('2025-13-01'), false);
    assert.equal(validarData('01/01/2025'), false);
});
