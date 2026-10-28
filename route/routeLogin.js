// ...existing code...
const jwt = require('jsonwebtoken');

// ...existing code...

// LOGIN
router.post('/login', async (req, res) => {
    const { email, senha } = req.body || {};

    if (!emailValido(email) || typeof senha !== 'string' || !senha) {
        return res.status(400).send({
            mensagem: 'Informe um email válido e a senha.'
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET não configurada.');
        return res.status(500).send({ mensagem: 'Erro na configuração da autenticação.' });
    }

    try {
        const resultado = await consultar(
            `SELECT id_usu, nome, email, senha
             FROM usuarios
             WHERE email = ? AND ativo = 1
             LIMIT 1`,
            [email.trim().toLowerCase()]
        );

        if (resultado.length === 0) {
            return res.status(401).send({ mensagem: 'Email ou senha inválidos.' });
        }

        const usuario = resultado[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).send({ mensagem: 'Email ou senha inválidos.' });
        }

        const token = jwt.sign(
            { sub: String(usuario.id_usu) },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.status(200).send({
            mensagem: 'Login realizado com sucesso.',
            token,
            usuario: {
                id_usuario: usuario.id_usu,
                nome: usuario.nome,
                email: usuario.email
            }
        });
    } catch (erro) {
        return responderErro(res, erro, 'Erro ao realizar login.');
    }
});

// ...existing code...