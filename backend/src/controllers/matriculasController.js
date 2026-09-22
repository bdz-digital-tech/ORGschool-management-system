const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { nextCode } = require('../utils/codeGenerator');
const { resolverClasseTurma } = require('../utils/resolverClasseTurma');

const BASE_SELECT = `
  SELECT m.id, m.numero, m.aluno_id AS "alunoId", a.nome AS aluno, a.codigo AS aluno_codigo,
         m.ano_lectivo AS "anoLectivo", m.classe_id AS "classeId", c.nome AS classe,
         m.turma_id AS "turmaId", t.nome AS turma,
         m.turno, m.data_matricula AS "dataMatricula", m.taxa_matricula AS "taxaMatricula",
         m.estado_pagamento AS "estadoPagamento", m.estado,
         m.data_renovacao AS "dataRenovacao", m.observacoes, m.escola_id AS "escolaId",
         m.created_at, m.updated_at
  FROM matriculas m
  JOIN alunos a ON a.id = m.aluno_id
  LEFT JOIN classes c ON c.id = m.classe_id
  LEFT JOIN turmas t ON t.id = m.turma_id
`;

async function attachTransferencias(matriculas) {
  if (matriculas.length === 0) return matriculas;
  const ids = matriculas.map((m) => m.id);
  const { rows } = await pool.query(
    `SELECT matricula_id, data, de_turma, para_turma, motivo
     FROM matricula_transferencias WHERE matricula_id = ANY($1) ORDER BY data`,
    [ids]
  );
  const map = {};
  rows.forEach((r) => (map[r.matricula_id] = map[r.matricula_id] || []).push(r));
  return matriculas.map((m) => ({ ...m, historicoTransferencias: map[m.id] || [] }));
}

// GET /api/matriculas?pagina=&limite=&estado=&estadoPagamento=&anoLectivo=
async function listar(req, res) {
  const { pagina, limite, offset } = getPaginationParams(req.query);
  const filtros = [`m.escola_id = $1`];
  const valores = [req.user.escolaId];

  if (req.query.estado) {
    valores.push(req.query.estado);
    filtros.push(`m.estado = $${valores.length}`);
  }
  if (req.query.estadoPagamento) {
    valores.push(req.query.estadoPagamento);
    filtros.push(`m.estado_pagamento = $${valores.length}`);
  }
  if (req.query.anoLectivo) {
    valores.push(req.query.anoLectivo);
    filtros.push(`m.ano_lectivo = $${valores.length}`);
  }
  if (req.query.q) {
    valores.push(`%${req.query.q}%`);
    filtros.push(`(a.nome ILIKE $${valores.length} OR m.numero ILIKE $${valores.length})`);
  }

  const where = `WHERE ${filtros.join(' AND ')}`;

  const totalRes = await pool.query(`SELECT COUNT(*) FROM matriculas m JOIN alunos a ON a.id = m.aluno_id ${where}`, valores);
  const total = parseInt(totalRes.rows[0].count, 10);

  const dataRes = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY m.data_matricula DESC LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, limite, offset]
  );

  const matriculas = await attachTransferencias(dataRes.rows);
  res.json({ dados: matriculas, paginacao: buildPaginationMeta(total, pagina, limite) });
}

// GET /api/matriculas/:id
async function obter(req, res) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE m.id = $1 AND m.escola_id = $2`, [req.params.id, req.user.escolaId]);
  if (rows.length === 0) throw new ApiError(404, 'Matrícula não encontrada.');
  const [matricula] = await attachTransferencias(rows);
  res.json(matricula);
}

// POST /api/matriculas  (aceita classeId/turmaId OU classe/turma por nome)
async function criar(req, res) {
  const b = req.body;
  const escolaId = req.user.escolaId;
  if (!b.alunoId) throw new ApiError(400, 'O campo "alunoId" é obrigatório.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const numero = b.numero || (await nextCode(client, { table: 'matriculas', column: 'numero', prefix: 'MAT', ano: b.anoLectivo, escolaId }));

    const { classeId, turmaId } = await resolverClasseTurma(client, {
      escolaId, classeId: b.classeId, turmaId: b.turmaId, classe: b.classe, turma: b.turma, anoLectivo: b.anoLectivo,
    });

    const { rows } = await client.query(
      `INSERT INTO matriculas
        (escola_id, numero, aluno_id, ano_lectivo, classe_id, turma_id, turno, data_matricula,
         taxa_matricula, estado_pagamento, estado, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        escolaId, numero, b.alunoId, b.anoLectivo || '2026/2027', classeId, turmaId,
        b.turno || null, b.dataMatricula || new Date().toISOString().split('T')[0],
        b.taxaMatricula || 0, b.estadoPagamento || 'Pendente', 'Ativa', b.observacoes || null,
      ]
    );
    const matriculaId = rows[0].id;

    // Sincroniza a turma/classe corrente do aluno
    await client.query(
      `UPDATE alunos SET turma_id = COALESCE($1, turma_id), classe_id = COALESCE($2, classe_id),
              ano_lectivo = COALESCE($3, ano_lectivo), estado = 'Ativo', updated_at = now()
       WHERE id = $4 AND escola_id = $5`,
      [turmaId, classeId, b.anoLectivo || null, b.alunoId, escolaId]
    );

    await client.query(
      `INSERT INTO historico_aluno (aluno_id, data, acao, detalhes) VALUES ($1, CURRENT_DATE, $2, $3)`,
      [b.alunoId, 'Matrícula realizada', b.observacoes || 'Nova matrícula']
    );

    // Pagamento da taxa de matrícula, se enviado (payload de Matriculas.jsx)
    if (b.taxaMatricula) {
      await client.query(
        `INSERT INTO pagamentos (aluno_id, data, valor, status, tipo, forma_pagamento, referencia, funcionario, mes_referencia)
         VALUES ($1,$2,$3,$4,'Matrícula',$5,$6,$7,$8)`,
        [
          b.alunoId, b.dataMatricula || new Date().toISOString().split('T')[0], b.taxaMatricula,
          b.estadoPagamento === 'Pago' ? 'Confirmado' : 'Pendente',
          b.formaPagamento || 'Dinheiro', numero, b.funcionario || 'Sistema', `Matrícula ${b.anoLectivo || ''}`,
        ]
      );
    }

    await client.query('COMMIT');

    const { rows: nova } = await pool.query(`${BASE_SELECT} WHERE m.id = $1`, [matriculaId]);
    const [matricula] = await attachTransferencias(nova);
    res.status(201).json(matricula);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// PUT /api/matriculas/:id
async function actualizar(req, res) {
  const { id } = req.params;
  const b = req.body;
  const escolaId = req.user.escolaId;

  const existe = await pool.query('SELECT id FROM matriculas WHERE id = $1 AND escola_id = $2', [id, escolaId]);
  if (existe.rows.length === 0) throw new ApiError(404, 'Matrícula não encontrada.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let classeId = b.classeId || null;
    let turmaId = b.turmaId || null;
    if ((!classeId && b.classe) || (!turmaId && b.turma)) {
      const resolvido = await resolverClasseTurma(client, {
        escolaId, classeId, turmaId, classe: b.classe, turma: b.turma, anoLectivo: b.anoLectivo,
      });
      classeId = resolvido.classeId;
      turmaId = resolvido.turmaId;
    }

    await client.query(
      `UPDATE matriculas SET
        classe_id = COALESCE($1, classe_id),
        turma_id = COALESCE($2, turma_id),
        turno = COALESCE($3, turno),
        taxa_matricula = COALESCE($4, taxa_matricula),
        estado_pagamento = COALESCE($5, estado_pagamento),
        estado = COALESCE($6, estado),
        observacoes = COALESCE($7, observacoes),
        updated_at = now()
       WHERE id = $8 AND escola_id = $9`,
      [classeId, turmaId, b.turno, b.taxaMatricula, b.estadoPagamento, b.estado, b.observacoes, id, escolaId]
    );

    await client.query('COMMIT');

    const { rows } = await pool.query(`${BASE_SELECT} WHERE m.id = $1`, [id]);
    const [matricula] = await attachTransferencias(rows);
    res.json(matricula);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// POST /api/matriculas/:id/transferir  { novaTurmaId, motivo }
async function transferir(req, res) {
  const { id } = req.params;
  const { novaTurmaId, motivo } = req.body;
  const escolaId = req.user.escolaId;
  if (!novaTurmaId) throw new ApiError(400, 'O campo "novaTurmaId" é obrigatório.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT m.id, m.aluno_id, m.turma_id, t.nome AS turma_actual
       FROM matriculas m LEFT JOIN turmas t ON t.id = m.turma_id WHERE m.id = $1 AND m.escola_id = $2`,
      [id, escolaId]
    );
    if (rows.length === 0) throw new ApiError(404, 'Matrícula não encontrada.');
    const matricula = rows[0];

    const { rows: novaTurmaRows } = await client.query(
      'SELECT id, nome, classe_id FROM turmas WHERE id = $1 AND escola_id = $2', [novaTurmaId, escolaId]
    );
    if (novaTurmaRows.length === 0) throw new ApiError(404, 'Turma de destino não encontrada.');
    const novaTurma = novaTurmaRows[0];

    await client.query(
      `INSERT INTO matricula_transferencias (matricula_id, data, de_turma, para_turma, motivo)
       VALUES ($1, CURRENT_DATE, $2, $3, $4)`,
      [id, matricula.turma_actual, novaTurma.nome, motivo || null]
    );

    await client.query(
      `UPDATE matriculas SET turma_id = $1, classe_id = $2, updated_at = now() WHERE id = $3`,
      [novaTurma.id, novaTurma.classe_id, id]
    );

    await client.query(
      `UPDATE alunos SET turma_id = $1, classe_id = $2, updated_at = now() WHERE id = $3`,
      [novaTurma.id, novaTurma.classe_id, matricula.aluno_id]
    );

    await client.query(
      `INSERT INTO historico_aluno (aluno_id, data, acao, detalhes) VALUES ($1, CURRENT_DATE, $2, $3)`,
      [matricula.aluno_id, 'Transferência de turma', `De ${matricula.turma_actual || '—'} para ${novaTurma.nome}: ${motivo || ''}`]
    );

    await client.query('COMMIT');

    const { rows: actualizada } = await pool.query(`${BASE_SELECT} WHERE m.id = $1`, [id]);
    const [resultado] = await attachTransferencias(actualizada);
    res.json(resultado);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// POST /api/matriculas/:id/renovar  { anoLectivo }
async function renovar(req, res) {
  const { id } = req.params;
  const { anoLectivo } = req.body;
  const escolaId = req.user.escolaId;
  if (!anoLectivo) throw new ApiError(400, 'O campo "anoLectivo" é obrigatório.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT aluno_id, classe_id, turma_id, turno, taxa_matricula FROM matriculas WHERE id = $1 AND escola_id = $2',
      [id, escolaId]
    );
    if (rows.length === 0) throw new ApiError(404, 'Matrícula não encontrada.');
    const anterior = rows[0];

    const numero = await nextCode(client, { table: 'matriculas', column: 'numero', prefix: 'MAT', ano: anoLectivo, escolaId });

    const { rows: novaRows } = await client.query(
      `INSERT INTO matriculas (escola_id, numero, aluno_id, ano_lectivo, classe_id, turma_id, turno,
                                data_matricula, taxa_matricula, estado_pagamento, estado, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_DATE,$8,'Pendente','Ativa','Renovação de matrícula')
       RETURNING id`,
      [escolaId, numero, anterior.aluno_id, anoLectivo, anterior.classe_id, anterior.turma_id, anterior.turno, anterior.taxa_matricula]
    );

    await client.query(`UPDATE matriculas SET data_renovacao = CURRENT_DATE WHERE id = $1`, [id]);

    await client.query(
      `INSERT INTO historico_aluno (aluno_id, data, acao, detalhes) VALUES ($1, CURRENT_DATE, $2, $3)`,
      [anterior.aluno_id, 'Renovação de matrícula', `Matrícula renovada para o ano lectivo ${anoLectivo}`]
    );

    await client.query('COMMIT');

    const { rows: nova } = await pool.query(`${BASE_SELECT} WHERE m.id = $1`, [novaRows[0].id]);
    const [resultado] = await attachTransferencias(nova);
    res.status(201).json(resultado);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// PATCH /api/matriculas/:id/cancelar
async function cancelar(req, res) {
  const { id } = req.params;
  const { rows } = await pool.query(
    `UPDATE matriculas SET estado = 'Cancelada', updated_at = now() WHERE id = $1 AND escola_id = $2 RETURNING aluno_id`,
    [id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Matrícula não encontrada.');

  await pool.query(
    `INSERT INTO historico_aluno (aluno_id, data, acao, detalhes) VALUES ($1, CURRENT_DATE, $2, $3)`,
    [rows[0].aluno_id, 'Matrícula cancelada', req.body.motivo || 'Cancelamento de matrícula']
  );

  res.json({ mensagem: 'Matrícula cancelada com sucesso.', id });
}

// DELETE /api/matriculas/:id
async function remover(req, res) {
  const { rows } = await pool.query(
    'DELETE FROM matriculas WHERE id = $1 AND escola_id = $2 RETURNING id',
    [req.params.id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Matrícula não encontrada.');
  res.status(204).send();
}

module.exports = { listar, obter, criar, actualizar, transferir, renovar, cancelar, remover };
