const pool = require('../mysql').pool;

function queryWith(connection, sql, values = []) {
    return new Promise((resolve, reject) => {
        connection.query(sql, values, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
}

function query(sql, values = []) {
    return new Promise((resolve, reject) => {
        pool.getConnection((connectionError, connection) => {
            if (connectionError) return reject(connectionError);

            queryWith(connection, sql, values)
                .then(resolve, reject)
                .finally(() => connection.release());
        });
    });
}

function transaction(callback) {
    return new Promise((resolve, reject) => {
        pool.getConnection((connectionError, connection) => {
            if (connectionError) return reject(connectionError);

            connection.beginTransaction(async transactionError => {
                if (transactionError) {
                    connection.release();
                    return reject(transactionError);
                }

                try {
                    const result = await callback({
                        query: (sql, values = []) => queryWith(connection, sql, values)
                    });

                    connection.commit(commitError => {
                        if (commitError) {
                            return connection.rollback(() => {
                                connection.release();
                                reject(commitError);
                            });
                        }

                        connection.release();
                        resolve(result);
                    });
                } catch (error) {
                    connection.rollback(() => {
                        connection.release();
                        reject(error);
                    });
                }
            });
        });
    });
}

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

    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).send({ mensagem: 'Registro duplicado.' });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2' ||
        error.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).send({ mensagem: 'Um dos registros relacionados não existe.' });
    }

    if (error.code === 'ER_ROW_IS_REFERENCED_2' ||
        error.code === 'ER_ROW_IS_REFERENCED') {
        return res.status(409).send({ mensagem: 'O registro possui dados relacionados.' });
    }

    return res.status(500).send({ mensagem });
}

module.exports = { query, transaction, validarId, validarData, responderErro };
