const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { nextCode } = require('../utils/codeGenerator');

async function attachRelations(professores) {
  if (professores.length === 0) return professores;
  const ids = professores.map((p) => p.id);

  const [discRes, classRes, turmaRes] = await Promise.all([
    pool.query(`SELECT professor_id, disciplina FROM professor_disciplinas WHERE professor_id = ANY($1)`, [ids]),
    pool.query(`SELECT professor_id, classe FROM professor_classes WHERE professor_id = ANY($1)`, [ids]),
    pool.query(
      `SELECT pt.professor_id, t.nome
       FROM professor_turmas pt JOIN turmas t ON t.id = pt.turma_id
       WHERE pt.professor_id = ANY($1)`,
      [ids]
    ),
  ]);

  const discMap = {}, classMap = {}, turmaMap = {};
  discRes.rows.forEach((d) => (discMap[d.professor_id] = discMap[d.professor_id] || []).push(d.disciplina));
  classRes.rows.forEach((c) => (classMap[c.professor_id] = classMap[c.professor_id] || []).push(c.classe));
  turmaRes.rows.forEach((t) => (turmaMap[t.professor_id] = turmaMap[t.professor_id] || []).push(t.nome));

  return professores.map((p) => ({
    ...p,
    disciplinas: discMap[p.id] || (p.especialidade ? p.especialidade.split(',').map((s) => s.trim()) : []),
    classes: classMap[p.id] || [],
    turmas: turmaMap[p.id] || [],
  }));
}

const BASE_SELECT = `
  SELECT id, codigo, nome, sexo, data_nascimento, contacto, email, endereco,
         especialidade, estado, data_contratacao, formacao, experiencia,
         observacoes, escola_id, created_at, updated_at
  FROM professores
`;

// GET /api/professores?pagina=&limite=&estado=&especialidade=&q=
async function listar(req, res) {
  const { pagina, limite, offset } = getPaginationParams(req.query);
  const filtros = [`escola_id = $1`];
  const valores = [req.user.escolaId];

  if (req.query.estado) {
    valores.push(req.query.estado);
    filtros.push(`estado = $${valores.length}`);
  }
  if (req.query.especialidade) {
    valores.push(`%${req.query.especialidade}%`);
    filtros.push(`especialidade ILIKE $${valores.length}`);
  }
  if (req.query.q) {
    valores.push(`%${req.query.q}%`);
    filtros.push(`(nome ILIKE $${valores.length} OR codigo ILIKE $${valores.length})`);
  }

  const where = `WHERE ${filtros.join(' AND ')}`;

  const totalRes = await pool.query(`SELECT COUNT(*) FROM professores ${where}`, valores);
  const total = parseInt(totalRes.rows[0].count, 10);

  const dataRes = await pool.query(
    `${BASE_SELECT} ${where} ORDER BY nome ASC LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    [...valores, limite, offset]
  );

  const professores = await attachRelations(dataRes.rows);
  res.json({ dados: professores, paginacao: buildPaginationMeta(total, pagina, limite) });
}

// GET /api/professores/:id
async function obter(req, res) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE id = $1 AND escola_id = $2`, [req.params.id, req.user.escolaId]);
  if (rows.length === 0) throw new ApiError(404, 'Professor não encontrado.');
  const [professor] = await attachRelations(rows);
  res.json(professor);
}

async function syncManyToMany(client, professorId, { disciplinas, classes, turmas }) {
  if (Array.isArray(disciplinas)) {
    await client.query('DELETE FROM professor_disciplinas WHERE professor_id = $1', [professorId]);
    for (const d of disciplinas) {
      await client.query('INSERT INTO professor_disciplinas (professor_id, disciplina) VALUES ($1, $2)', [professorId, d]);
    }
  }
  if (Array.isArray(classes)) {
    await client.query('DELETE FROM professor_classes WHERE professor_id = $1', [professorId]);
    for (const c of classes) {
      await client.query('INSERT INTO professor_classes (professor_id, classe) VALUES ($1, $2)', [professorId, c]);
    }
  }
  if (Array.isArray(turmas)) {
    await client.query('DELETE FROM professor_turmas WHERE professor_id = $1', [professorId]);
    for (const turmaNome of turmas) {
      const { rows } = await client.query('SELECT id FROM turmas WHERE nome = $1 LIMIT 1', [turmaNome]);
      if (rows.length) {
        await client.query('INSERT INTO professor_turmas (professor_id, turma_id) VALUES ($1, $2)', [professorId, rows[0].id]);
      }
    }
  }
}

// POST /api/professores  (payload snake_case, ver src/services/api.js)
async function criar(req, res) {
  const b = req.body;
  const escolaId = req.user.escolaId;
  if (!b.nome) throw new ApiError(400, 'O campo "nome" é obrigatório.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const codigo = b.codigo || (await nextCode(client, { table: 'professores', prefix: 'PROF', escolaId }));

    const { rows } = await client.query(
      `INSERT INTO professores
        (escola_id, codigo, nome, sexo, data_nascimento, contacto, email, endereco,
         especialidade, estado, data_contratacao, formacao, experiencia, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        escolaId, codigo, b.nome, b.sexo || null, b.data_nascimento || null, b.contacto || null,
        b.email || null, b.endereco || null, b.especialidade || null, b.estado || 'Ativo',
        b.data_contratacao || new Date().toISOString().split('T')[0], b.formacao || null,
        b.experiencia || null, b.observacoes || null,
      ]
    );
    const professorId = rows[0].id;

    await syncManyToMany(client, professorId, b);
    await client.query('COMMIT');

    const { rows: novo } = await pool.query(`${BASE_SELECT} WHERE id = $1`, [professorId]);
    const [professor] = await attachRelations(novo);
    res.status(201).json(professor);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// PUT /api/professores/:id
async function actualizar(req, res) {
  const { id } = req.params;
  const b = req.body;
  const escolaId = req.user.escolaId;

  const existe = await pool.query('SELECT id FROM professores WHERE id = $1 AND escola_id = $2', [id, escolaId]);
  if (existe.rows.length === 0) throw new ApiError(404, 'Professor não encontrado.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE professores SET
        nome = COALESCE($1, nome),
        sexo = COALESCE($2, sexo),
        data_nascimento = COALESCE($3, data_nascimento),
        contacto = COALESCE($4, contacto),
        email = COALESCE($5, email),
        endereco = COALESCE($6, endereco),
        especialidade = COALESCE($7, especialidade),
        estado = COALESCE($8, estado),
        data_contratacao = COALESCE($9, data_contratacao),
        formacao = COALESCE($10, formacao),
        experiencia = COALESCE($11, experiencia),
        observacoes = COALESCE($12, observacoes),
        updated_at = now()
       WHERE id = $13 AND escola_id = $14`,
      [
        b.nome, b.sexo, b.data_nascimento, b.contacto, b.email, b.endereco,
        b.especialidade, b.estado, b.data_contratacao, b.formacao, b.experiencia,
        b.observacoes, id, escolaId,
      ]
    );

    await syncManyToMany(client, id, b);
    await client.query('COMMIT');

    const { rows } = await pool.query(`${BASE_SELECT} WHERE id = $1`, [id]);
    const [professor] = await attachRelations(rows);
    res.json(professor);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// PATCH /api/professores/:id/estado
async function alterarEstado(req, res) {
  const { id } = req.params;
  const { estado } = req.body;
  if (!estado) throw new ApiError(400, 'O campo "estado" é obrigatório.');

  const { rows } = await pool.query(
    `UPDATE professores SET estado = $1, updated_at = now() WHERE id = $2 AND escola_id = $3 RETURNING id`,
    [estado, id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Professor não encontrado.');
  res.json({ mensagem: 'Estado actualizado com sucesso.', id, estado });
}

// DELETE /api/professores/:id
async function remover(req, res) {
  const { rows } = await pool.query(
    'DELETE FROM professores WHERE id = $1 AND escola_id = $2 RETURNING id',
    [req.params.id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Professor não encontrado.');
  res.status(204).send();
}

// ---- Associações dedicadas ----

async function adicionarTurma(req, res) {
  const { id } = req.params;
  const { turmaId } = req.body;
  if (!turmaId) throw new ApiError(400, 'O campo "turmaId" é obrigatório.');

  const professor = await pool.query('SELECT id FROM professores WHERE id = $1 AND escola_id = $2', [id, req.user.escolaId]);
  if (professor.rows.length === 0) throw new ApiError(404, 'Professor não encontrado.');

  const jaExiste = await pool.query('SELECT id FROM professor_turmas WHERE professor_id = $1 AND turma_id = $2', [id, turmaId]);
  if (jaExiste.rows.length === 0) {
    await pool.query('INSERT INTO professor_turmas (professor_id, turma_id) VALUES ($1, $2)', [id, turmaId]);
  }
  res.status(201).json({ mensagem: 'Turma associada ao professor com sucesso.' });
}

async function removerTurma(req, res) {
  const { id, turmaId } = req.params;
  const { rows } = await pool.query(
    'DELETE FROM professor_turmas WHERE professor_id = $1 AND turma_id = $2 RETURNING id',
    [id, turmaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Associação professor/turma não encontrada.');
  res.status(204).send();
}

async function adicionarDisciplina(req, res) {
  const { id } = req.params;
  const { disciplina } = req.body;
  if (!disciplina) throw new ApiError(400, 'O campo "disciplina" é obrigatório.');

  const professor = await pool.query('SELECT id FROM professores WHERE id = $1 AND escola_id = $2', [id, req.user.escolaId]);
  if (professor.rows.length === 0) throw new ApiError(404, 'Professor não encontrado.');

  const { rows } = await pool.query(
    'INSERT INTO professor_disciplinas (professor_id, disciplina) VALUES ($1, $2) RETURNING id',
    [id, disciplina]
  );
  res.status(201).json({ id: rows[0].id, mensagem: 'Disciplina associada com sucesso.' });
}

async function removerDisciplina(req, res) {
  const { id, disciplinaId } = req.params;
  const { rows } = await pool.query(
    'DELETE FROM professor_disciplinas WHERE professor_id = $1 AND id = $2 RETURNING id',
    [id, disciplinaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Disciplina não encontrada para este professor.');
  res.status(204).send();
}

async function adicionarClasse(req, res) {
  const { id } = req.params;
  const { classe } = req.body;
  if (!classe) throw new ApiError(400, 'O campo "classe" é obrigatório.');

  const professor = await pool.query('SELECT id FROM professores WHERE id = $1 AND escola_id = $2', [id, req.user.escolaId]);
  if (professor.rows.length === 0) throw new ApiError(404, 'Professor não encontrado.');

  const { rows } = await pool.query(
    'INSERT INTO professor_classes (professor_id, classe) VALUES ($1, $2) RETURNING id',
    [id, classe]
  );
  res.status(201).json({ id: rows[0].id, mensagem: 'Classe associada com sucesso.' });
}

async function removerClasse(req, res) {
  const { id, classeAssocId } = req.params;
  const { rows } = await pool.query(
    'DELETE FROM professor_classes WHERE professor_id = $1 AND id = $2 RETURNING id',
    [id, classeAssocId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Classe não encontrada para este professor.');
  res.status(204).send();
}

module.exports = {
  listar, obter, criar, actualizar, alterarEstado, remover,
  adicionarTurma, removerTurma,
  adicionarDisciplina, removerDisciplina,
  adicionarClasse, removerClasse,
};
