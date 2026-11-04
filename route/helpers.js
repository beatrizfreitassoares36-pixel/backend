function validarId(id) {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
}

function validarData(data) {
    if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return false;
    }

    const [ano, mes, dia] = data.split('-').map(Number);
    const date = new Date(Date.UTC(ano, mes - 1, dia));
    return date.getUTCFullYear() === ano &&
        date.getUTCMonth() === mes - 1 &&
        date.getUTCDate() === dia;
}

function responderErro(res, error, mensagem) {
    console.error(mensagem, error);
    const code = error.original?.code || error.code;

    if (code === 'ER_DUP_ENTRY') {
        return res.status(409).send({ mensagem: 'Registro duplicado.' });
    }

    if (code === 'ER_NO_REFERENCED_ROW_2' ||
        code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).send({ mensagem: 'Um dos registros relacionados não existe.' });
    }

    if (code === 'ER_ROW_IS_REFERENCED_2' ||
        code === 'ER_ROW_IS_REFERENCED') {
        return res.status(409).send({ mensagem: 'O registro possui dados relacionados.' });
    }

    return res.status(500).send({ mensagem });
}

module.exports = { validarId, validarData, responderErro };
