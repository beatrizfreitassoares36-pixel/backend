require('dotenv').config();
const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');

const requiredVariables = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missingVariables = requiredVariables.filter(variable => !process.env[variable]);

if (missingVariables.length > 0) {
    throw new Error(`Variáveis de conexão ausentes: ${missingVariables.join(', ')}.`);
}

const port = Number(process.env.DB_PORT || 3306);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT deve ser uma porta válida entre 1 e 65535.');
}

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD || '',
    {
        dialect: 'mysql',
        dialectModule: mysql2,
        host: process.env.DB_HOST,
        port,
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = sequelize;
