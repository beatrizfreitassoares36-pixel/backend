require('dotenv').config();
const sequelize = require('../sequelize');

async function checkDatabase() {
    try {
        await sequelize.authenticate();
        const [rows] = await sequelize.query('SELECT 1 AS ok');

        if (rows[0]?.ok !== 1) {
            throw new Error('A consulta de verificação retornou um resultado inesperado.');
        }

        console.log('Conexão Sequelize com MySQL verificada com sucesso.');
    } finally {
        await sequelize.close();
    }
}

checkDatabase().catch(error => {
    console.error('Falha ao verificar a conexão Sequelize com MySQL:', error.message);
    process.exitCode = 1;
});
