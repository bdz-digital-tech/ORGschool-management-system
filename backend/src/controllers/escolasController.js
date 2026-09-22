const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

const BASE_SELECT = `
  SELECT id, nome, nif, endereco, telefone, email, config_recibo AS "configRecibo", estado, created_at
  FROM escolas
`;

// GET /api/escolas  — super_admin vê todas; os outros só a sua própria
async function listar(req, res) {
  if (req.user.role === 'super_admin') {
    const { rows } = await pool.query(`${BASE_SELECT} ORDER BY nome ASC`);
    return res.json(rows);
  }
  const { rows } = await pool.query(`${BASE_SELECT} WHERE id = $1`, [req.user.escolaId]);
  res.json(rows);
}

// GET /api/escolas/:id
async function obter(req, res) {
  const { id } = req.params;
  if (req.user.role !== 'super_admin' && Number(id) !== req.user.escolaId) {
    throw new ApiError(403, 'Não tens permissão para ver esta escola.');
  }
  const { rows } = await pool.query(`${BASE_SELECT} WHERE id = $1`, [id]);
  if (rows.length === 0) throw new ApiError(404, 'Escola não encontrada.');
  res.json(rows[0]);
}

// PUT /api/escolas/:id  { nome, nif, endereco, telefone, email, configRecibo }
async function actualizar(req, res) {
  const { id } = req.params;
  const b = req.body;

  if (req.user.role !== 'super_admin' && Number(id) !== req.user.escolaId) {
    throw new ApiError(403, 'Não tens permissão para editar esta escola.');
  }
  if (req.user.role === 'secretaria' || req.user.role === 'professor') {
    throw new ApiError(403, 'Só administradores podem editar os dados da escola.');
  }

  const { rows } = await pool.query(
    `UPDATE escolas SET
      nome = COALESCE($1, nome),
      nif = COALESCE($2, nif),
      endereco = COALESCE($3, endereco),
      telefone = COALESCE($4, telefone),
      email = COALESCE($5, email),
      config_recibo = COALESCE($6, config_recibo)
     WHERE id = $7
     RETURNING id, nome, nif, endereco, telefone, email, config_recibo AS "configRecibo", estado`,
    [
      b.nome, b.nif, b.endereco, b.telefone, b.email,
      b.configRecibo ? JSON.stringify(b.configRecibo) : null, id,
    ]
  );
  if (rows.length === 0) throw new ApiError(404, 'Escola não encontrada.');
  res.json(rows[0]);
}

module.exports = { listar, obter, actualizar };
