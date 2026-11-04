const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
    const segredo = process.env.JWT_SECRET;
    if (!segredo) {
        console.error('JWT_SECRET não configurada.');
        return res.status(500).send({ mensagem: 'Erro na configuração da autenticação.' });
    }

    const cabecalho = req.headers.authorization;
    const correspondencia = typeof cabecalho === 'string'
        ? /^Bearer\s+(.+)$/i.exec(cabecalho)
        : null;

    if (!correspondencia) {
        return res.status(401).send({ mensagem: 'Autenticação necessária.' });
    }

    try {
        req.usuario = jwt.verify(correspondencia[1], segredo);
        return next();
    } catch {
        return res.status(401).send({ mensagem: 'Token inválido ou expirado.' });
    }
}

module.exports = autenticar;
