const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const BASE_SELECT = `
  SELECT p.id, p.aluno_id AS "alunoId", a.nome AS aluno, a.codigo AS aluno_codigo,
         p.data, p.valor, p.valor_base AS "valorBase", p.multa,
         p.propina_mensal AS "propinaMensal", p.meses_selecionados AS "mesesSelecionados",
         p.status, p.tipo, p.forma_pagamento AS "formaPagamento",
         p.referencia, p.funcionario, p.mes_referencia AS "mesReferencia", p.created_at
  FROM pagamentos p
  JOIN alunos a ON a.id = p.aluno_id
`;

// GET /api/pagamentos?pagina=&limite=&status=&alunoId=
async function listar(req, res) {
  const { pagina, limite, offset } = getPaginationParams(req.query);
  const filtros = [`a.escola_id = $1`];
  const valores = [req.user.escolaId];

  if (req.query.status) {
    valores.push(req.query.status);
    filtros.push(`p.status = $${valores.length}`);
  }
  if (req.query.alunoId) {
    valores.push(req.query.alunoId);
    filtros.push(`p.aluno_id = $${valores.length}`);
  }

  const where = `WHERE ${filtros.join(' AND ')}`;

  const totalRes = await pool.query(`SELECT COUNT(*) FROM pagamentos p JOIN alunos a ON a.id = p.aluno_id ${where}`, valores);
  const total = parseInt(totalRes.rows[0].count, 10);

  const dataRes = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY p.data DESC LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, limite, offset]
  );

  res.json({
    dados: dataRes.rows.map((p) => ({ ...p, valor: Number(p.valor), valorBase: p.valorBase != null ? Number(p.valorBase) : null, multa: Number(p.multa || 0), propinaMensal: p.propinaMensal != null ? Number(p.propinaMensal) : null })),
    paginacao: buildPaginationMeta(total, pagina, limite),
  });
}

// GET /api/pagamentos/:id
async function obter(req, res) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE p.id = $1 AND a.escola_id = $2`, [req.params.id, req.user.escolaId]);
  if (rows.length === 0) throw new ApiError(404, 'Pagamento não encontrado.');
  res.json(rows[0]);
}

// POST /api/pagamentos  { alunoId, data, valor, valorBase, multa, propinaMensal, mesesSelecionados, status, tipo, formaPagamento, referencia, funcionario, mesReferencia }
async function criar(req, res) {
  const b = req.body;
  if (!b.alunoId || !b.valor) throw new ApiError(400, 'Os campos "alunoId" e "valor" são obrigatórios.');

  const aluno = await pool.query('SELECT id FROM alunos WHERE id = $1 AND escola_id = $2', [b.alunoId, req.user.escolaId]);
  if (aluno.rows.length === 0) throw new ApiError(404, 'Aluno não encontrado.');

  const { rows } = await pool.query(
    `INSERT INTO pagamentos
      (aluno_id, data, valor, valor_base, multa, propina_mensal, meses_selecionados,
       status, tipo, forma_pagamento, referencia, funcionario, mes_referencia)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING id, aluno_id AS "alunoId", data, valor, valor_base AS "valorBase", multa,
               propina_mensal AS "propinaMensal", meses_selecionados AS "mesesSelecionados",
               status, tipo, forma_pagamento AS "formaPagamento", referencia, funcionario,
               mes_referencia AS "mesReferencia"`,
    [
      b.alunoId, b.data || new Date().toISOString().split('T')[0], b.valor,
      b.valorBase != null ? b.valorBase : null, b.multa || 0,
      b.propinaMensal != null ? b.propinaMensal : null,
      Array.isArray(b.mesesSelecionados) ? b.mesesSelecionados : null,
      b.status || 'Pendente', b.tipo || 'Propina', b.formaPagamento || 'Dinheiro',
      b.referencia || null, b.funcionario || null, b.mesReferencia || null,
    ]
  );

  const pagamento = { ...rows[0], valor: Number(rows[0].valor), valorBase: rows[0].valorBase != null ? Number(rows[0].valorBase) : null, multa: Number(rows[0].multa || 0), propinaMensal: rows[0].propinaMensal != null ? Number(rows[0].propinaMensal) : null };

  await pool.query(
    `INSERT INTO historico_aluno (aluno_id, data, acao, detalhes) VALUES ($1, CURRENT_DATE, 'Pagamento', $2)`,
    [b.alunoId, `Pagamento de ${b.valor} registado (${b.status || 'Pendente'})`]
  );

  res.status(201).json(pagamento);
}

// PUT /api/pagamentos/:id
async function actualizar(req, res) {
  const { id } = req.params;
  const b = req.body;

  const { rows } = await pool.query(
    `UPDATE pagamentos p SET
      data = COALESCE($1, data),
      valor = COALESCE($2, valor),
      valor_base = COALESCE($3, valor_base),
      multa = COALESCE($4, multa),
      propina_mensal = COALESCE($5, propina_mensal),
      meses_selecionados = COALESCE($6, meses_selecionados),
      status = COALESCE($7, status),
      tipo = COALESCE($8, tipo),
      forma_pagamento = COALESCE($9, forma_pagamento),
      referencia = COALESCE($10, referencia),
      funcionario = COALESCE($11, funcionario),
      mes_referencia = COALESCE($12, mes_referencia)
     FROM alunos a
     WHERE p.aluno_id = a.id AND p.id = $13 AND a.escola_id = $14
     RETURNING p.id, p.aluno_id AS "alunoId", p.data, p.valor, p.valor_base AS "valorBase",
               p.multa, p.propina_mensal AS "propinaMensal", p.meses_selecionados AS "mesesSelecionados",
               p.status, p.tipo, p.forma_pagamento AS "formaPagamento", p.referencia,
               p.funcionario, p.mes_referencia AS "mesReferencia"`,
    [
      b.data, b.valor, b.valorBase, b.multa, b.propinaMensal,
      Array.isArray(b.mesesSelecionados) ? b.mesesSelecionados : null,
      b.status, b.tipo, b.formaPagamento, b.referencia, b.funcionario, b.mesReferencia,
      id, req.user.escolaId,
    ]
  );
  if (rows.length === 0) throw new ApiError(404, 'Pagamento não encontrado.');

  const pagamento = { ...rows[0], valor: Number(rows[0].valor), valorBase: rows[0].valorBase != null ? Number(rows[0].valorBase) : null, multa: Number(rows[0].multa || 0), propinaMensal: rows[0].propinaMensal != null ? Number(rows[0].propinaMensal) : null };
  res.json(pagamento);
}

// PATCH /api/pagamentos/:id  { status }
async function actualizarStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) throw new ApiError(400, 'O campo "status" é obrigatório.');

  const { rows } = await pool.query(
    `UPDATE pagamentos p SET status = $1 FROM alunos a
     WHERE p.aluno_id = a.id AND p.id = $2 AND a.escola_id = $3
     RETURNING p.id`,
    [status, id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Pagamento não encontrado.');
  res.json({ id: rows[0].id, mensagem: 'Pagamento actualizado com sucesso.' });
}

// DELETE /api/pagamentos/:id
async function remover(req, res) {
  const { rows } = await pool.query(
    `DELETE FROM pagamentos p USING alunos a
     WHERE p.aluno_id = a.id AND p.id = $1 AND a.escola_id = $2
     RETURNING p.id`,
    [req.params.id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Pagamento não encontrado.');
  res.status(204).send();
}

module.exports = { listar, obter, criar, actualizar, actualizarStatus, remover };
