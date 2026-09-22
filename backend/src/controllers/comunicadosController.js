const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/comunicados?status=&lido=
async function listar(req, res) {
  const filtros = [`escola_id = $1`];
  const valores = [req.user.escolaId];
  if (req.query.status) {
    valores.push(req.query.status);
    filtros.push(`status = $${valores.length}`);
  }
  if (req.query.lido !== undefined) {
    valores.push(req.query.lido === 'true');
    filtros.push(`lido = $${valores.length}`);
  }
  const where = `WHERE ${filtros.join(' AND ')}`;

  const { rows } = await pool.query(
    `SELECT id, titulo, conteudo, destinatario, status, icon, badge,
            badge_type AS "badgeType", lido, data
     FROM comunicados ${where} ORDER BY data DESC`,
    valores
  );
  res.json(rows);
}

// POST /api/comunicados
async function criar(req, res) {
  const b = req.body;
  if (!b.titulo) throw new ApiError(400, 'O campo "titulo" é obrigatório.');

  const { rows } = await pool.query(
    `INSERT INTO comunicados (escola_id, titulo, conteudo, destinatario, status, icon, badge, badge_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, titulo, conteudo, destinatario, status, icon, badge, badge_type AS "badgeType", lido, data`,
    [
      req.user.escolaId, b.titulo, b.conteudo || null, b.destinatario || 'Todos', b.status || 'Publicado',
      b.icon || null, b.badge || null, b.badgeType || null,
    ]
  );
  res.status(201).json(rows[0]);
}

// PUT /api/comunicados/:id
async function actualizar(req, res) {
  const { id } = req.params;
  const b = req.body;

  const { rows } = await pool.query(
    `UPDATE comunicados SET
      titulo = COALESCE($1, titulo),
      conteudo = COALESCE($2, conteudo),
      destinatario = COALESCE($3, destinatario),
      status = COALESCE($4, status)
     WHERE id = $5 AND escola_id = $6
     RETURNING id, titulo, conteudo, destinatario, status, icon, badge, badge_type AS "badgeType", lido, data`,
    [b.titulo, b.conteudo, b.destinatario, b.status, id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Comunicado não encontrado.');
  res.json(rows[0]);
}

// PATCH /api/comunicados/:id/lido
async function marcarLido(req, res) {
  const { rows } = await pool.query(
    'UPDATE comunicados SET lido = true WHERE id = $1 AND escola_id = $2 RETURNING id',
    [req.params.id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Comunicado não encontrado.');
  res.json({ mensagem: 'Comunicado marcado como lido.', id: rows[0].id });
}

// DELETE /api/comunicados/:id
async function remover(req, res) {
  const { rows } = await pool.query(
    'DELETE FROM comunicados WHERE id = $1 AND escola_id = $2 RETURNING id',
    [req.params.id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Comunicado não encontrado.');
  res.status(204).send();
}

module.exports = { listar, criar, actualizar, marcarLido, remover };
