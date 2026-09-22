const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/classes?anoLectivo=2026
// Devolve classes com as respectivas turmas aninhadas (formato usado pelo frontend)
async function listarClasses(req, res) {
  const filtros = [`c.escola_id = $1`];
  const valores = [req.user.escolaId];
  if (req.query.anoLectivo) {
    valores.push(req.query.anoLectivo);
    filtros.push(`c.ano_lectivo = $${valores.length}`);
  }
  const where = `WHERE ${filtros.join(' AND ')}`;

  const { rows: classes } = await pool.query(
    `SELECT id, nome, ano_lectivo FROM classes c ${where} ORDER BY nome ASC`,
    valores
  );
  if (classes.length === 0) return res.json([]);

  const classeIds = classes.map((c) => c.id);
  const { rows: turmas } = await pool.query(
    `SELECT t.id, t.nome, t.classe_id, t.turno, t.sala, t.capacidade_maxima,
            p.nome AS professor_responsavel,
            (SELECT COUNT(*) FROM alunos a WHERE a.turma_id = t.id AND a.estado = 'Ativo') AS alunos_atuais
     FROM turmas t
     LEFT JOIN professores p ON p.id = t.professor_responsavel_id
     WHERE t.classe_id = ANY($1)
     ORDER BY t.nome ASC`,
    [classeIds]
  );

  const turmaIds = turmas.map((t) => t.id);
  let alunosPorTurma = {};
  if (turmaIds.length) {
    const { rows: alunos } = await pool.query(
      `SELECT id, nome, codigo, sexo, turma_id FROM alunos WHERE turma_id = ANY($1) AND estado = 'Ativo' ORDER BY nome`,
      [turmaIds]
    );
    alunos.forEach((a) => {
      alunosPorTurma[a.turma_id] = alunosPorTurma[a.turma_id] || [];
      alunosPorTurma[a.turma_id].push({ id: a.id, nome: a.nome, codigo: a.codigo, sexo: a.sexo });
    });
  }

  const turmasPorClasse = {};
  turmas.forEach((t) => {
    turmasPorClasse[t.classe_id] = turmasPorClasse[t.classe_id] || [];
    turmasPorClasse[t.classe_id].push({
      id: t.id,
      nome: t.nome,
      turno: t.turno,
      sala: t.sala,
      professorResponsavel: t.professor_responsavel,
      capacidadeMaxima: t.capacidade_maxima,
      alunosAtuais: Number(t.alunos_atuais),
      alunos: alunosPorTurma[t.id] || [],
    });
  });

  const resultado = classes.map((c) => ({
    id: c.id,
    nome: c.nome,
    anoLectivo: c.ano_lectivo,
    turmas: turmasPorClasse[c.id] || [],
  }));

  res.json(resultado);
}

// POST /api/classes  { nome, anoLectivo }
async function criarClasse(req, res) {
  const { nome, anoLectivo } = req.body;
  if (!nome) throw new ApiError(400, 'O campo "nome" é obrigatório.');

  const { rows } = await pool.query(
    `INSERT INTO classes (escola_id, nome, ano_lectivo) VALUES ($1, $2, $3) RETURNING id, nome, ano_lectivo`,
    [req.user.escolaId, nome, anoLectivo || '2026/2027']
  );
  res.status(201).json(rows[0]);
}

// PUT /api/classes/:id
async function actualizarClasse(req, res) {
  const { id } = req.params;
  const { nome, anoLectivo } = req.body;

  const { rows } = await pool.query(
    `UPDATE classes SET nome = COALESCE($1, nome), ano_lectivo = COALESCE($2, ano_lectivo) WHERE id = $3 AND escola_id = $4
     RETURNING id, nome, ano_lectivo`,
    [nome, anoLectivo, id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Classe não encontrada.');
  res.json(rows[0]);
}

// DELETE /api/classes/:id
async function removerClasse(req, res) {
  const { rows } = await pool.query(
    'DELETE FROM classes WHERE id = $1 AND escola_id = $2 RETURNING id',
    [req.params.id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Classe não encontrada.');
  res.status(204).send();
}

// GET /api/turmas?classeId=&turno=&professorId=
async function listarTurmas(req, res) {
  const filtros = [`t.escola_id = $1`];
  const valores = [req.user.escolaId];
  if (req.query.classeId) {
    valores.push(req.query.classeId);
    filtros.push(`t.classe_id = $${valores.length}`);
  }
  if (req.query.turno) {
    valores.push(req.query.turno);
    filtros.push(`t.turno = $${valores.length}`);
  }
  if (req.query.professorId) {
    valores.push(req.query.professorId);
    filtros.push(`t.professor_responsavel_id = $${valores.length}`);
  }
  const where = `WHERE ${filtros.join(' AND ')}`;

  const { rows } = await pool.query(
    `SELECT t.id, t.nome, t.classe_id, c.nome AS classe, t.turno, t.sala,
            t.professor_responsavel_id, p.nome AS professor_responsavel, t.capacidade_maxima,
            (SELECT COUNT(*) FROM alunos a WHERE a.turma_id = t.id AND a.estado = 'Ativo') AS alunos_atuais
     FROM turmas t
     LEFT JOIN classes c ON c.id = t.classe_id
     LEFT JOIN professores p ON p.id = t.professor_responsavel_id
     ${where}
     ORDER BY c.nome, t.nome`,
    valores
  );

  res.json(rows.map((t) => ({ ...t, alunos_atuais: Number(t.alunos_atuais) })));
}

// GET /api/turmas/:id
async function obterTurma(req, res) {
  const { rows } = await pool.query(
    `SELECT t.id, t.nome, t.classe_id, c.nome AS classe, t.turno, t.sala,
            t.professor_responsavel_id, p.nome AS professor_responsavel, t.capacidade_maxima
     FROM turmas t
     LEFT JOIN classes c ON c.id = t.classe_id
     LEFT JOIN professores p ON p.id = t.professor_responsavel_id
     WHERE t.id = $1 AND t.escola_id = $2`,
    [req.params.id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Turma não encontrada.');

  const { rows: alunos } = await pool.query(
    `SELECT id, nome, codigo, sexo FROM alunos WHERE turma_id = $1 AND estado = 'Ativo' ORDER BY nome`,
    [req.params.id]
  );

  res.json({ ...rows[0], alunos });
}

// POST /api/turmas  { nome, classeId, turno, sala, professorResponsavelId, capacidadeMaxima }
async function criarTurma(req, res) {
  const b = req.body;
  if (!b.nome || !b.classeId) throw new ApiError(400, 'Os campos "nome" e "classeId" são obrigatórios.');

  const { rows } = await pool.query(
    `INSERT INTO turmas (escola_id, nome, classe_id, turno, sala, professor_responsavel_id, capacidade_maxima)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [req.user.escolaId, b.nome, b.classeId, b.turno || 'Manhã', b.sala || null, b.professorResponsavelId || null, b.capacidadeMaxima || 30]
  );
  res.status(201).json({ id: rows[0].id, mensagem: 'Turma criada com sucesso.' });
}

// PUT /api/turmas/:id
async function actualizarTurma(req, res) {
  const { id } = req.params;
  const b = req.body;

  const { rows } = await pool.query(
    `UPDATE turmas SET
      nome = COALESCE($1, nome),
      turno = COALESCE($2, turno),
      sala = COALESCE($3, sala),
      professor_responsavel_id = COALESCE($4, professor_responsavel_id),
      capacidade_maxima = COALESCE($5, capacidade_maxima)
     WHERE id = $6 AND escola_id = $7 RETURNING id`,
    [b.nome, b.turno, b.sala, b.professorResponsavelId, b.capacidadeMaxima, id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Turma não encontrada.');
  res.json({ id: rows[0].id, mensagem: 'Turma actualizada com sucesso.' });
}

// DELETE /api/turmas/:id
async function removerTurma(req, res) {
  const { rows } = await pool.query(
    'DELETE FROM turmas WHERE id = $1 AND escola_id = $2 RETURNING id',
    [req.params.id, req.user.escolaId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Turma não encontrada.');
  res.status(204).send();
}

// POST /api/turmas/:id/transferir-aluno  { alunoId, turmaDestinoId, motivo }
async function transferirAluno(req, res) {
  const { id } = req.params; // turma de origem
  const { alunoId, turmaDestinoId, motivo } = req.body;
  if (!alunoId || !turmaDestinoId) throw new ApiError(400, 'Os campos "alunoId" e "turmaDestinoId" são obrigatórios.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: destinoRows } = await client.query(
      'SELECT id, nome, classe_id FROM turmas WHERE id = $1 AND escola_id = $2',
      [turmaDestinoId, req.user.escolaId]
    );
    if (destinoRows.length === 0) throw new ApiError(404, 'Turma de destino não encontrada.');
    const destino = destinoRows[0];

    const { rows: origemRows } = await client.query('SELECT nome FROM turmas WHERE id = $1', [id]);
    const origemNome = origemRows[0]?.nome || null;

    await client.query(
      `UPDATE alunos SET turma_id = $1, classe_id = $2, updated_at = now() WHERE id = $3`,
      [destino.id, destino.classe_id, alunoId]
    );

    await client.query(
      `UPDATE matriculas SET turma_id = $1, classe_id = $2, updated_at = now()
       WHERE aluno_id = $3 AND estado = 'Ativa'`,
      [destino.id, destino.classe_id, alunoId]
    );

    await client.query(
      `INSERT INTO historico_aluno (aluno_id, data, acao, detalhes) VALUES ($1, CURRENT_DATE, $2, $3)`,
      [alunoId, 'Transferência de turma', `De ${origemNome || '—'} para ${destino.nome}: ${motivo || ''}`]
    );

    await client.query('COMMIT');
    res.json({ mensagem: 'Aluno transferido com sucesso.' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  listarClasses,
  criarClasse,
  actualizarClasse,
  removerClasse,
  listarTurmas,
  obterTurma,
  criarTurma,
  actualizarTurma,
  removerTurma,
  transferirAluno,
};
