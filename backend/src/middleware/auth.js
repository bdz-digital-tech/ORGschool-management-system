const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'muda-esta-chave-em-producao';

// Exige um token válido. Injecta req.user = { id, nome, email, role, escolaId }
function verificarToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) throw new ApiError(401, 'Sessão expirada ou token não fornecido.');

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, nome, email, role, escolaId }
    next();
  } catch (err) {
    throw new ApiError(401, 'Sessão expirada. Faça login novamente.');
  }
}

// Restringe a certos papéis (usar depois de verificarToken)
function exigirPapel(...papeis) {
  return (req, res, next) => {
    if (!req.user || !papeis.includes(req.user.role)) {
      throw new ApiError(403, 'Não tens permissão para aceder a este recurso.');
    }
    next();
  };
}

module.exports = { verificarToken, exigirPapel, JWT_SECRET };
