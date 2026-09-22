const pool = require('../config/db');

// GET /api/dashboard
async function resumo(req, res) {
  const escolaId = req.user.escolaId;

  const [
    totalAlunos,
    totalProfessores,
    totalTurmas,
    matriculados,
    matriculasPendentes,
    pagamentosHoje,
    pagamentosPendentes,
    comunicados,
    comunicadosNaoLidos,
    actividadesRecentes,
    comunicadosRecentes,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM alunos WHERE estado = 'Ativo' AND escola_id = $1`, [escolaId]),
    pool.query(`SELECT COUNT(*) FROM professores WHERE estado = 'Ativo' AND escola_id = $1`, [escolaId]),
    pool.query(`SELECT COUNT(*) FROM turmas WHERE escola_id = $1`, [escolaId]),
    pool.query(`SELECT COUNT(*) FROM matriculas WHERE estado = 'Ativa' AND escola_id = $1`, [escolaId]),
    pool.query(`SELECT COUNT(*) FROM matriculas WHERE estado_pagamento = 'Pendente' AND estado = 'Ativa' AND escola_id = $1`, [escolaId]),
    pool.query(
      `SELECT COALESCE(SUM(p.valor), 0) AS total, COUNT(*) AS qtd
       FROM pagamentos p JOIN alunos a ON a.id = p.aluno_id
       WHERE p.status IN ('Pago', 'Confirmado') AND p.data = CURRENT_DATE AND a.escola_id = $1`,
      [escolaId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(p.valor), 0) AS total, COUNT(*) AS qtd
       FROM pagamentos p JOIN alunos a ON a.id = p.aluno_id
       WHERE p.status = 'Pago' AND a.escola_id = $1`,
      [escolaId]
    ),
    pool.query(`SELECT COUNT(*) FROM comunicados WHERE escola_id = $1`, [escolaId]),
    pool.query(`SELECT COUNT(*) FROM comunicados WHERE lido = false AND escola_id = $1`, [escolaId]),
    pool.query(`SELECT icon, texto, badge, badge_type AS "badgeType", data FROM actividades WHERE escola_id = $1 ORDER BY data DESC LIMIT 8`, [escolaId]),
    pool.query(`SELECT icon, titulo, destinatario, status, badge, badge_type AS "badgeType", data FROM comunicados WHERE escola_id = $1 ORDER BY data DESC LIMIT 8`, [escolaId]),
  ]);

  const totalAlunosNum = parseInt(totalAlunos.rows[0].count, 15);
  const matriculadosNum = parseInt(matriculados.rows[0].count, 10);

  res.json({
    totalAlunos: totalAlunosNum,
    totalProfessores: parseInt(totalProfessores.rows[0].count, 10),
    totalTurmas: parseInt(totalTurmas.rows[0].count, 10),
    matriculados: matriculadosNum,
    percentualMatriculados: totalAlunosNum > 0 ? Number(((matriculadosNum / totalAlunosNum) * 100).toFixed(1)) : 0,
    matriculasPendentes: parseInt(matriculasPendentes.rows[0].count, 10),
    pagamentosHoje: {
      total: Number(pagamentosHoje.rows[0].total),
      quantidade: parseInt(pagamentosHoje.rows[0].qtd, 10),
    },
    pagamentosPendentes: {
      total: Number(pagamentosPendentes.rows[0].total),
      quantidade: parseInt(pagamentosPendentes.rows[0].qtd, 10),
    },
    comunicados: {
      total: parseInt(comunicados.rows[0].count, 10),
      naoLidos: parseInt(comunicadosNaoLidos.rows[0].count, 10),
    },
    actividadesRecentes: actividadesRecentes.rows,
    comunicadosRecentes: comunicadosRecentes.rows,
  });
}

module.exports = { resumo };
