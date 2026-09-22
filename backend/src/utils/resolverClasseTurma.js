const { ApiError } = require('../middleware/errorHandler');

async function resolverClasseTurma(client, { escolaId, classeId, turmaId, classe, turma, anoLectivo }) {
  let resolvedClasseId = classeId || null;
  let resolvedTurmaId = turmaId || null;

  if (!resolvedClasseId && classe) {
    let rows = [];
    if (anoLectivo) {
      const exato = await client.query(
        `SELECT id FROM classes WHERE escola_id = $1 AND nome = $2 AND ano_lectivo = $3 LIMIT 1`,
        [escolaId, classe, anoLectivo]
      );
      rows = exato.rows;
    }
    // Fallback: mesma escola + mesmo nome, ignorando o ano lectivo
    // (evita falhas quando o ano foi gravado em formatos diferentes, ex. "2026" vs "2026/2027")
    if (rows.length === 0) {
      const semAno = await client.query(
        `SELECT id FROM classes WHERE escola_id = $1 AND nome = $2 ORDER BY ano_lectivo DESC LIMIT 1`,
        [escolaId, classe]
      );
      rows = semAno.rows;
    }
    if (rows.length === 0) throw new ApiError(404, `Classe "${classe}" não encontrada para esta escola.`);
    resolvedClasseId = rows[0].id;
  }

  if (!resolvedTurmaId && turma) {
    const params = resolvedClasseId ? [escolaId, turma, resolvedClasseId] : [escolaId, turma];
    const query = resolvedClasseId
      ? `SELECT t.id, t.classe_id FROM turmas t WHERE t.escola_id = $1 AND t.nome = $2 AND t.classe_id = $3 LIMIT 1`
      : `SELECT t.id, t.classe_id FROM turmas t WHERE t.escola_id = $1 AND t.nome = $2 LIMIT 1`;
    const { rows } = await client.query(query, params);
    if (rows.length === 0) throw new ApiError(404, `Turma "${turma}" não encontrada para esta escola.`);
    resolvedTurmaId = rows[0].id;
    if (!resolvedClasseId) resolvedClasseId = rows[0].classe_id;
  }

  return { classeId: resolvedClasseId, turmaId: resolvedTurmaId };
}

module.exports = { resolverClasseTurma };
