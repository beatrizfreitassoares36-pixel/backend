require('dotenv').config();
const http = require('http');
const app = require('./app');
const sequelize = require('./sequelize');
const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT deve ser uma porta válida entre 1 e 65535.');
}

async function iniciarServidor() {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados verificada.');

    const server = http.createServer(app);
    await new Promise((resolve, reject) => {
        const onError = error => reject(error);
        server.once('error', onError);
        server.listen(port, '0.0.0.0', () => {
            server.off('error', onError);
            resolve();
        });
    });

    console.log(`Servidor rodando na porta ${port}`);

    let encerrando = false;
    for (const signal of ['SIGINT', 'SIGTERM']) {
        process.once(signal, () => {
            if (encerrando) return;
            encerrando = true;
            server.close(error => {
                if (error) {
                    console.error('Erro ao encerrar o servidor HTTP:', error);
                    process.exitCode = 1;
                }

                sequelize.close().then(
                    () => {
                        if (!error) console.log('Conexões com o banco encerradas.');
                    },
                    closeError => {
                        console.error('Erro ao encerrar a conexão com o banco:', closeError);
                        process.exitCode = 1;
                    }
                );
            });
        });
    }
}

iniciarServidor().catch(async error => {
    console.error('Não foi possível iniciar a API:', error);
    try {
        await sequelize.close();
    } catch (closeError) {
        console.error('Erro ao encerrar o pool do banco após falha de inicialização:', closeError);
    }
    process.exitCode = 1;
});
