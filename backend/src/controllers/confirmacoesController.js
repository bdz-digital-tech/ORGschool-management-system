const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

const BASE_SELECT = `
  SELECT c.id, c.aluno_id AS "alunoId", a.nome AS "alunoNome", c.matricula_id AS "matriculaId",
         c.ano_lectivo_anterior AS "anoLectivoAnterior", c.novo_ano_lectivo AS "novoAnoLectivo",
         c.nova_classe AS "novaClasse", c.nova_turma AS "novaTurma", c.estado,
         c.data_solicitacao AS "dataSolicitacao", c.data_confirmacao AS "dataConfirmacao"
  FROM confirmacoes c
  JOIN alunos a ON a.id = c.aluno_id
`;

// GET /api/confirmacoes?estado=&alunoId=
async function listar(req, res) {
  const filtros = [`c.escola_id = $1`];
  const valores = [req.user.escolaId];
  if (req.query.estado) {
    valores.push(req.query.estado);
    filtros.push(`c.estado = $${valores.length}`);
  }
  if (req.query.alunoId) {
    valores.push(req.query.alunoId);
    filtros.push(`c.aluno_id = $${valores.length}`);
  }
  const where = `WHERE ${filtros.join(' AND ')}`;

  const { rows } = await pool.query(`${BASE_SELECT} ${where} ORDER BY c.data_solicitacao DESC`, valores);
  res.json(rows);
}

// GET /api/confirmacoes/:id
async function obter(req, res) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE c.id = $1 AND c.escola_id = $2`, [req.params.id, req.user.escolaId]);
  if (rows.length === 0) throw new ApiError(404, 'Confirmação não encontrada.');
  res.json(rows[0]);
}

// POST /api/confirmacoes  { alunoId, matriculaId, anoLectivoAnterior, novoAnoLectivo, novaClasse, novaTurma }
async function criar(req, res) {
  const b = req.body;
  if (!b.alunoId || !b.novoAnoLectivo) {
    throw new ApiError(400, 'Os campos "alunoId" e "novoAnoLectivo" são obrigatórios.');
  }

  const { rows } = await pool.query(
    `INSERT INTO confirmacoes
      (escola_id, aluno_id, matricula_id, ano_lectivo_anterior, novo_ano_lectivo, nova_classe, nova_turma, periodo, valor_mensalidade, observacoes, estado)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'Pendente') RETURNING id`,
    [
      req.user.escolaId, b.alunoId, b.matriculaId || null, b.anoLectivoAnterior || null, b.novoAnoLectivo,
      b.novaClasse || null, b.novaTurma || null, b.periodo || null, b.valorMensalidade || null, b.observacoes || null,
    ]
  );

  const { rows: nova } = await pool.query(`${BASE_SELECT} WHERE c.id = $1`, [rows[0].id]);
  res.status(201).json(nova[0]);
}

// PATCH /api/confirmacoes/:id/confirmar
async function confirmar(req, res) {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `UPDATE confirmacoes SET estado = 'Confirmado', data_confirmacao = now() WHERE id = $1 AND escola_id = $2
       RETURNING aluno_id, novo_ano_lectivo, nova_classe, nova_turma`,
      [id, req.user.escolaId]
    );
    if (rows.length === 0) throw new ApiError(404, 'Confirmação não encontrada.');
    const conf = rows[0];

    await client.query(
      `INSERT INTO historico_aluno (aluno_id, data, acao, detalhes) VALUES ($1, CURRENT_DATE, 'Reconfirmação de matrícula', $2)`,
      [conf.aluno_id, `Confirmado para ${conf.nova_classe || ''} Turma ${conf.nova_turma || ''} (${conf.novo_ano_lectivo})`]
    );

    await client.query('COMMIT');
    const { rows: actualizada } = await pool.query(`${BASE_SELECT} WHERE c.id = $1`, [id]);
    res.json(actualizada[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// PATCH /api/confirmacoes/:id/rejeitar
async function rejeitar(req, res) {
  const { rows } = await pool.query(
    `UPDATE confirmacoes SET estado = 'Rejeitado', data_confirmacao = now() WHERE id = $1 AND escola_id = $2 RETURNING id`,
    [req.params.id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Confirmação não encontrada.');
  res.json({ mensagem: 'Confirmação rejeitada.', id: rows[0].id });
}

// DELETE /api/confirmacoes/:id
async function remover(req, res) {
  const { rows } = await pool.query(
    'DELETE FROM confirmacoes WHERE id = $1 AND escola_id = $2 RETURNING id',
    [req.params.id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Confirmação não encontrada.');
  res.status(204).send();
}

async function actualizar(req, res) {
  const { id } = req.params;
  const b = req.body;

  const { rows } = await pool.query(
    `UPDATE confirmacoes SET
      nova_classe = COALESCE($1, nova_classe),
      nova_turma = COALESCE($2, nova_turma),
      novo_ano_lectivo = COALESCE($3, novo_ano_lectivo),
      periodo = COALESCE($4, periodo),
      valor_mensalidade = COALESCE($5, valor_mensalidade),
      observacoes = COALESCE($6, observacoes),
      estado = COALESCE($7, estado)
     WHERE id = $8 AND escola_id = $9 RETURNING id`,
    [
      b.novaClasse, b.novaTurma, b.novoAnoLectivo, b.periodo,
      b.valorMensalidade, b.observacoes, b.estado, id, req.user.escolaId,
    ]
  );
  if (rows.length === 0) throw new ApiError(404, 'Confirmação não encontrada.');

  const { rows: actualizada } = await pool.query(`${BASE_SELECT} WHERE c.id = $1`, [id]);
  res.json(actualizada[0]);
}


module.exports = { listar, obter, criar, confirmar, rejeitar, remover , actualizar };
