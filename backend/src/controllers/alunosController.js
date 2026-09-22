const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { nextCode } = require('../utils/codeGenerator');
const { resolverClasseTurma } = require('../utils/resolverClasseTurma');

// Junta os dados relacionados (documentos, pagamentos, histórico) a uma lista de alunos
async function attachRelations(alunos) {
  if (alunos.length === 0) return alunos;
  const ids = alunos.map((a) => a.id);

  const [docsRes, pagsRes, histRes] = await Promise.all([
    pool.query(`SELECT aluno_id, id, nome FROM documentos_aluno WHERE aluno_id = ANY($1)`, [ids]),
    pool.query(
      `SELECT id, aluno_id, data, valor, status, tipo, forma_pagamento AS "formaPagamento",
              referencia, funcionario, mes_referencia AS "mesReferencia"
       FROM pagamentos WHERE aluno_id = ANY($1) ORDER BY data`,
      [ids]
    ),
    pool.query(`SELECT aluno_id, data, acao, detalhes FROM historico_aluno WHERE aluno_id = ANY($1) ORDER BY data`, [ids]),
  ]);

  const docsMap = {}, pagsMap = {}, histMap = {};
  docsRes.rows.forEach((d) => (docsMap[d.aluno_id] = docsMap[d.aluno_id] || []).push(d.nome));
  pagsRes.rows.forEach((p) => (pagsMap[p.aluno_id] = pagsMap[p.aluno_id] || []).push({ ...p, valor: Number(p.valor) }));
  histRes.rows.forEach((h) => (histMap[h.aluno_id] = histMap[h.aluno_id] || []).push({ data: h.data, acao: h.acao, detalhes: h.detalhes }));

  return alunos.map((a) => ({
    ...a,
    documentos: docsMap[a.id] || [],
    pagamentos: pagsMap[a.id] || [],
    historico: histMap[a.id] || [],
  }));
}

const BASE_SELECT = `
  SELECT a.id, a.codigo, a.nome, a.sexo, a.data_nascimento, a.bi, a.contacto, a.email,
         a.encarregado, a.contacto_encarregado, a.email_encarregado, a.parentesco,
         a.turma_id, t.nome AS turma, a.classe_id, c.nome AS classe,
         a.ano_lectivo, a.estado, a.data_matricula, a.escola_id, a.created_at, a.updated_at
  FROM alunos a
  LEFT JOIN turmas t ON t.id = a.turma_id
  LEFT JOIN classes c ON c.id = a.classe_id
`;

// GET /api/alunos?pagina=1&limite=10&estado=Ativo&turma_id=1
async function listar(req, res) {
  const { pagina, limite, offset } = getPaginationParams(req.query);
  const filtros = [`a.escola_id = $1`];
  const valores = [req.user.escolaId];

  if (req.query.estado) {
    valores.push(req.query.estado);
    filtros.push(`a.estado = $${valores.length}`);
  }
  if (req.query.turma_id) {
    valores.push(req.query.turma_id);
    filtros.push(`a.turma_id = $${valores.length}`);
  }
  if (req.query.classe_id) {
    valores.push(req.query.classe_id);
    filtros.push(`a.classe_id = $${valores.length}`);
  }
  if (req.query.ano_lectivo) {
    valores.push(req.query.ano_lectivo);
    filtros.push(`a.ano_lectivo = $${valores.length}`);
  }

  const where = `WHERE ${filtros.join(' AND ')}`;

  const totalRes = await pool.query(`SELECT COUNT(*) FROM alunos a ${where}`, valores);
  const total = parseInt(totalRes.rows[0].count, 10);

  const dataRes = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY a.nome ASC LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, limite, offset]
  );

  const alunos = await attachRelations(dataRes.rows);

  res.json({
    dados: alunos,
    paginacao: buildPaginationMeta(total, pagina, limite),
  });
}

// GET /api/alunos/pesquisa?q=texto  — pesquisa por nome ou código, só dentro da escola
async function pesquisar(req, res) {
  const q = (req.query.q || '').trim();
  if (!q) throw new ApiError(400, 'Parâmetro de pesquisa "q" é obrigatório.');

  const { pagina, limite, offset } = getPaginationParams(req.query);
  const termo = `%${q}%`;
  const escolaId = req.user.escolaId;

  const totalRes = await pool.query(
    `SELECT COUNT(*) FROM alunos a WHERE a.escola_id = $1 AND (a.nome ILIKE $2 OR a.codigo ILIKE $2)`,
    [escolaId, termo]
  );
  const total = parseInt(totalRes.rows[0].count, 10);

  const dataRes = await pool.query(
    `${BASE_SELECT} WHERE a.escola_id = $1 AND (a.nome ILIKE $2 OR a.codigo ILIKE $2)
     ORDER BY a.nome ASC LIMIT $3 OFFSET $4`,
    [escolaId, termo, limite, offset]
  );

  const alunos = await attachRelations(dataRes.rows);

  res.json({
    dados: alunos,
    paginacao: buildPaginationMeta(total, pagina, limite),
  });
}

// GET /api/alunos/:id
async function obter(req, res) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE a.id = $1 AND a.escola_id = $2`, [req.params.id, req.user.escolaId]);
  if (rows.length === 0) throw new ApiError(404, 'Aluno não encontrado.');
  const [aluno] = await attachRelations(rows);
  res.json(aluno);
}

// POST /api/alunos  (payload em snake_case, ver src/services/api.js do frontend)
async function criar(req, res) {
  const b = req.body;
  const escolaId = req.user.escolaId;
  if (!b.nome) throw new ApiError(400, 'O campo "nome" é obrigatório.');
  if (!escolaId) throw new ApiError(400, 'Utilizador sem escola associada.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const codigo = b.codigo || (await nextCode(client, { table: 'alunos', prefix: 'AL', ano: b.ano_lectivo, escolaId }));

    // Aceita classe_id/turma_id directos OU classe/turma por nome (resolve aqui)
    const { classeId, turmaId } = await resolverClasseTurma(client, {
      escolaId,
      classeId: b.classe_id,
      turmaId: b.turma_id,
      classe: b.classe,
      turma: b.turma,
      anoLectivo: b.ano_lectivo,
    });

    const { rows } = await client.query(
      `INSERT INTO alunos
        (escola_id, codigo, nome, sexo, data_nascimento, bi, contacto, email, encarregado,
         contacto_encarregado, email_encarregado, parentesco, turma_id, classe_id,
         ano_lectivo, estado, data_matricula)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [
        escolaId, codigo, b.nome, b.sexo || null, b.data_nascimento || null, b.bi || null,
        b.contacto || null, b.email || null, b.encarregado || null, b.contacto_encarregado || null,
        b.email_encarregado || null, b.parentesco || null, turmaId, classeId,
        b.ano_lectivo || null, b.estado || 'Ativo',
        b.data_matricula || new Date().toISOString().split('T')[0],
      ]
    );
    const alunoId = rows[0].id;

    if (Array.isArray(b.documentos)) {
      for (const doc of b.documentos) {
        await client.query(`INSERT INTO documentos_aluno (aluno_id, nome) VALUES ($1, $2)`, [alunoId, doc]);
      }
    }

    await client.query(
      `INSERT INTO historico_aluno (aluno_id, data, acao, detalhes) VALUES ($1, CURRENT_DATE, $2, $3)`,
      [alunoId, 'Matrícula realizada', 'Cadastro inicial']
    );

    await client.query('COMMIT');

    const { rows: novo } = await pool.query(`${BASE_SELECT} WHERE a.id = $1`, [alunoId]);
    const [aluno] = await attachRelations(novo);
    res.status(201).json(aluno);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// PUT /api/alunos/:id  (mesmo payload snake_case do criar)
async function actualizar(req, res) {
  const { id } = req.params;
  const b = req.body;
  const escolaId = req.user.escolaId;

  const existe = await pool.query('SELECT id FROM alunos WHERE id = $1 AND escola_id = $2', [id, escolaId]);
  if (existe.rows.length === 0) throw new ApiError(404, 'Aluno não encontrado.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let classeId = b.classe_id || null;
    let turmaId = b.turma_id || null;
    if ((!classeId && b.classe) || (!turmaId && b.turma)) {
      const resolvido = await resolverClasseTurma(client, {
        escolaId, classeId, turmaId, classe: b.classe, turma: b.turma, anoLectivo: b.ano_lectivo,
      });
      classeId = resolvido.classeId;
      turmaId = resolvido.turmaId;
    }

    await client.query(
      `UPDATE alunos SET
        nome = COALESCE($1, nome),
        sexo = COALESCE($2, sexo),
        data_nascimento = COALESCE($3, data_nascimento),
        bi = COALESCE($4, bi),
        contacto = COALESCE($5, contacto),
        email = COALESCE($6, email),
        encarregado = COALESCE($7, encarregado),
        contacto_encarregado = COALESCE($8, contacto_encarregado),
        email_encarregado = COALESCE($9, email_encarregado),
        parentesco = COALESCE($10, parentesco),
        turma_id = COALESCE($11, turma_id),
        classe_id = COALESCE($12, classe_id),
        ano_lectivo = COALESCE($13, ano_lectivo),
        estado = COALESCE($14, estado),
        data_matricula = COALESCE($15, data_matricula),
        updated_at = now()
       WHERE id = $16 AND escola_id = $17`,
      [
        b.nome, b.sexo, b.data_nascimento, b.bi, b.contacto, b.email, b.encarregado,
        b.contacto_encarregado, b.email_encarregado, b.parentesco, turmaId,
        classeId, b.ano_lectivo, b.estado, b.data_matricula, id, escolaId,
      ]
    );

    if (Array.isArray(b.documentos)) {
      await client.query('DELETE FROM documentos_aluno WHERE aluno_id = $1', [id]);
      for (const doc of b.documentos) {
        await client.query('INSERT INTO documentos_aluno (aluno_id, nome) VALUES ($1, $2)', [id, doc]);
      }
    }

    await client.query(
      `INSERT INTO historico_aluno (aluno_id, data, acao, detalhes) VALUES ($1, CURRENT_DATE, $2, $3)`,
      [id, 'Actualização', 'Dados do aluno actualizados']
    );

    await client.query('COMMIT');

    const { rows } = await pool.query(`${BASE_SELECT} WHERE a.id = $1`, [id]);
    const [aluno] = await attachRelations(rows);
    res.json(aluno);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// PATCH /api/alunos/:id/estado
async function alterarEstado(req, res) {
  const { id } = req.params;
  const { estado } = req.body;
  if (!estado) throw new ApiError(400, 'O campo "estado" é obrigatório.');

  const { rows } = await pool.query(
    `UPDATE alunos SET estado = $1, updated_at = now() WHERE id = $2 AND escola_id = $3 RETURNING id`,
    [estado, id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Aluno não encontrado.');

  await pool.query(
    `INSERT INTO historico_aluno (aluno_id, data, acao, detalhes) VALUES ($1, CURRENT_DATE, $2, $3)`,
    [id, 'Alteração de estado', `Estado alterado para ${estado}`]
  );

  res.json({ mensagem: 'Estado actualizado com sucesso.', id, estado });
}

// DELETE /api/alunos/:id
async function remover(req, res) {
  const { rows } = await pool.query(
    'DELETE FROM alunos WHERE id = $1 AND escola_id = $2 RETURNING id',
    [req.params.id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Aluno não encontrado.');
  res.status(204).send();
}

// ---- Documentos do aluno ----

async function listarDocumentos(req, res) {
  const { rows } = await pool.query(
    'SELECT id, nome FROM documentos_aluno WHERE aluno_id = $1 ORDER BY id',
    [req.params.id]
  );
  res.json(rows);
}

async function adicionarDocumento(req, res) {
  const { id } = req.params;
  const { nome } = req.body;
  if (!nome) throw new ApiError(400, 'O campo "nome" é obrigatório.');

  const aluno = await pool.query('SELECT id FROM alunos WHERE id = $1 AND escola_id = $2', [id, req.user.escolaId]);
  if (aluno.rows.length === 0) throw new ApiError(404, 'Aluno não encontrado.');

  const { rows } = await pool.query(
    'INSERT INTO documentos_aluno (aluno_id, nome) VALUES ($1, $2) RETURNING id, nome',
    [id, nome]
  );
  res.status(201).json(rows[0]);
}

async function removerDocumento(req, res) {
  const { id, docId } = req.params;
  const { rows } = await pool.query(
    'DELETE FROM documentos_aluno WHERE aluno_id = $1 AND id = $2 RETURNING id',
    [id, docId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Documento não encontrado para este aluno.');
  res.status(204).send();
}

async function listarHistorico(req, res) {
  const aluno = await pool.query('SELECT id FROM alunos WHERE id = $1 AND escola_id = $2', [req.params.id, req.user.escolaId]);
  if (aluno.rows.length === 0) throw new ApiError(404, 'Aluno não encontrado.');

  const { rows } = await pool.query(
    'SELECT id, data, acao, detalhes FROM historico_aluno WHERE aluno_id = $1 ORDER BY data DESC, id DESC',
    [req.params.id]
  );
  res.json(rows);
}

module.exports = {
  listar, pesquisar, obter, criar, actualizar, alterarEstado, remover,
  listarDocumentos, adicionarDocumento, removerDocumento,
  listarHistorico,
};
