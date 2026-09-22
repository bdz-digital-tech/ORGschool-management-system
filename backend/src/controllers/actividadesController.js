const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

async function listar(req, res) {
  let limite = parseInt(req.query.limite, 10);
  if (!Number.isInteger(limite) || limite < 1) limite = 20;
  if (limite > 100) limite = 100;

  const { rows } = await pool.query(
    `SELECT id, icon, texto, badge, badge_type AS "badgeType", data
     FROM actividades WHERE escola_id = $1 ORDER BY data DESC LIMIT $2`,
    [req.user.escolaId, limite]
  );
  res.json(rows);
}

async function criar(req, res) {
  const b = req.body;
  if (!b.texto) throw new ApiError(400, 'O campo "texto" é obrigatório.');

  const { rows } = await pool.query(
    `INSERT INTO actividades (escola_id, icon, texto, badge, badge_type) VALUES ($1,$2,$3,$4,$5)
     RETURNING id, icon, texto, badge, badge_type AS "badgeType", data`,
    [req.user.escolaId, b.icon || null, b.texto, b.badge || null, b.badgeType || null]
  );
  res.status(201).json(rows[0]);
}

async function remover(req, res) {
  const { rows } = await pool.query(
    'DELETE FROM actividades WHERE id = $1 AND escola_id = $2 RETURNING id',
    [req.params.id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Actividade não encontrada.');
  res.status(204).send();
}

module.exports = { listar, criar, remover };
