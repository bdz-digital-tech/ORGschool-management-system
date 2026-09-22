const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

function gerarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      escolaId: usuario.escola_id,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// POST /api/auth/login  { email, senha }
async function login(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) throw new ApiError(400, 'Email e senha são obrigatórios.');

  const { rows } = await pool.query(
    `SELECT u.id, u.nome, u.email, u.senha_hash, u.role, u.escola_id, u.estado,
            e.nome AS escola_nome, e.endereco AS escola_endereco, e.telefone AS escola_telefone,
            e.email AS escola_email, e.config_recibo AS escola_config_recibo
     FROM usuarios u
     LEFT JOIN escolas e ON e.id = u.escola_id
     WHERE u.email = $1`,
    [email.toLowerCase().trim()]
  );
  if (rows.length === 0) throw new ApiError(401, 'Email ou senha inválidos.');

  const usuario = rows[0];
  if (usuario.estado !== 'Ativo') throw new ApiError(403, 'Esta conta está inactiva.');

  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaValida) throw new ApiError(401, 'Email ou senha inválidos.');

  const token = gerarToken(usuario);
  res.json({
    token,
    user: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      escolaId: usuario.escola_id,
    },
    escola: usuario.escola_id ? {
      id: usuario.escola_id,
      nome: usuario.escola_nome,
      endereco: usuario.escola_endereco,
      telefone: usuario.escola_telefone,
      email: usuario.escola_email,
      configRecibo: usuario.escola_config_recibo || {},
    } : null,
  });
}

// POST /api/auth/register  { nome, email, senha, role }
// Cria um utilizador na MESMA escola de quem está autenticado (admin/secretaria a convidar colegas)
async function registar(req, res) {
  const { nome, email, senha, role } = req.body;
  if (!nome || !email || !senha) throw new ApiError(400, 'Nome, email e senha são obrigatórios.');
  if (!req.user?.escolaId) throw new ApiError(400, 'Utilizador autenticado sem escola associada.');

  const senhaHash = await bcrypt.hash(senha, 10);

  const { rows } = await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, role, escola_id)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, nome, email, role, escola_id`,
    [nome, email.toLowerCase().trim(), senhaHash, role || 'secretaria', req.user.escolaId]
  );

  res.status(201).json(rows[0]);
}

// POST /api/auth/setup  { masterKey, escola: {...}, admin: { nome, email, senha } }
// Bootstrap: cria uma nova escola + o seu primeiro utilizador admin. Protegido por MASTER_KEY.
async function setup(req, res) {
  const { masterKey, escola, admin } = req.body;
  if (masterKey !== process.env.MASTER_KEY) throw new ApiError(403, 'Chave mestra inválida.');
  if (!escola?.nome) throw new ApiError(400, 'O nome da escola é obrigatório.');
  if (!admin?.nome || !admin?.email || !admin?.senha) {
    throw new ApiError(400, 'Os dados do administrador (nome, email, senha) são obrigatórios.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: escolaRows } = await client.query(
      `INSERT INTO escolas (nome, nif, endereco, telefone, email)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, nome`,
      [escola.nome, escola.nif || null, escola.endereco || null, escola.telefone || null, escola.email || null]
    );
    const escolaId = escolaRows[0].id;

    const senhaHash = await bcrypt.hash(admin.senha, 10);
    const { rows: userRows } = await client.query(
      `INSERT INTO usuarios (nome, email, senha_hash, role, escola_id)
       VALUES ($1,$2,$3,'admin',$4)
       RETURNING id, nome, email, role, escola_id`,
      [admin.nome, admin.email.toLowerCase().trim(), senhaHash, escolaId]
    );

    await client.query('COMMIT');

    const token = gerarToken({ ...userRows[0], escola_id: escolaId });
    res.status(201).json({
      escola: { ...escolaRows[0], configRecibo: {} },
      user: userRows[0],
      token,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// GET /api/auth/me
async function me(req, res) {
  const { rows } = await pool.query(
    `SELECT e.nome AS escola_nome, e.endereco AS escola_endereco, e.telefone AS escola_telefone,
            e.email AS escola_email, e.config_recibo AS escola_config_recibo
     FROM escolas e WHERE e.id = $1`,
    [req.user.escolaId]
  );
  const escola = rows[0]
    ? {
        id: req.user.escolaId,
        nome: rows[0].escola_nome,
        endereco: rows[0].escola_endereco,
        telefone: rows[0].escola_telefone,
        email: rows[0].escola_email,
        configRecibo: rows[0].escola_config_recibo || {},
      }
    : null;

  res.json({ user: req.user, escola });
}

module.exports = { login, registar, setup, me };
