// src/db/seed-demo-data.js
// Gera dados de demonstração: 100+ professores, 120+ matrículas, 150+ pagamentos.
// Usa a escola, classes, turmas e alunos que já existirem na base de dados.
//
// Corre com:  node src/db/seed-demo-data.js
require('dotenv').config();
const pool = require('../config/db');

const PRIMEIROS_NOMES = [
  'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Isabel', 'António', 'Teresa',
  'Manuel', 'Luísa', 'Francisco', 'Filomena', 'Domingos', 'Cristina', 'José',
  'Fátima', 'Miguel', 'Rosa', 'André', 'Beatriz', 'Rui', 'Helena', 'Vasco',
  'Marta', 'Nelson', 'Sandra', 'Eduardo', 'Paula', 'Fernando', 'Cátia',
];
const ULTIMOS_NOMES = [
  'Silva', 'Santos', 'Ferreira', 'Costa', 'Lopes', 'Martins', 'Pereira',
  'Gonçalves', 'Fernandes', 'Rodrigues', 'Almeida', 'Carvalho', 'Neto',
  'Domingos', 'Kiala', 'Sachipengo', 'Chiluvia', 'Bento', 'Cardoso', 'Vieira',
];
const ESPECIALIDADES = [
  'Matemática', 'Português', 'Física', 'Química', 'Biologia', 'História',
  'Geografia', 'Inglês', 'Francês', 'Educação Física', 'Informática', 'Artes',
];
const FORMAS_PAGAMENTO = ['Dinheiro', 'Transferência', 'Multicaixa', 'TPA'];
const TIPOS_PAGAMENTO = ['Propina', 'Matrícula', 'Confirmação', 'Material'];

function aleatorio(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}
function nomeAleatorio() {
  return `${aleatorio(PRIMEIROS_NOMES)} ${aleatorio(ULTIMOS_NOMES)} ${aleatorio(ULTIMOS_NOMES)}`;
}
function dataAleatoria(inicioAno = 2026, fimMesesAtras = 0) {
  const inicio = new Date(`${inicioAno}-01-01`).getTime();
  const fim = Date.now() - fimMesesAtras * 30 * 24 * 60 * 60 * 1000;
  const t = inicio + Math.random() * Math.max(fim - inicio, 0);
  return new Date(t).toISOString().split('T')[0];
}

async function run() {
  const client = await pool.connect();
  try {
    const { rows: escolas } = await client.query('SELECT id FROM escolas ORDER BY id LIMIT 1');
    if (escolas.length === 0) throw new Error('Nenhuma escola encontrada — corre primeiro o seed principal (npm run db:seed).');
    const escolaId = escolas[0].id;

    const { rows: turmas } = await client.query(
      'SELECT id, classe_id, nome FROM turmas WHERE escola_id = $1', [escolaId]
    );
    const { rows: alunos } = await client.query(
      'SELECT id FROM alunos WHERE escola_id = $1', [escolaId]
    );
    if (turmas.length === 0) throw new Error('Esta escola não tem turmas — cria classes/turmas primeiro.');
    if (alunos.length === 0) throw new Error('Esta escola não tem alunos — cria alunos primeiro (as matrículas/pagamentos precisam deles).');

    const { rows: profCount } = await client.query(
      'SELECT COUNT(*) FROM professores WHERE escola_id = $1', [escolaId]
    );
    const { rows: matCount } = await client.query(
      'SELECT COUNT(*) FROM matriculas WHERE escola_id = $1', [escolaId]
    );
    let proximoProf = parseInt(profCount[0].count, 10) + 1;
    let proximaMat = parseInt(matCount[0].count, 10) + 1;

    await client.query('BEGIN');

    // ---- 100 PROFESSORES ----
    for (let i = 0; i < 100; i++) {
      const codigo = `PROF-2026-${String(proximoProf++).padStart(3, '0')}`;
      await client.query(
        `INSERT INTO professores
          (escola_id, codigo, nome, sexo, contacto, email, especialidade, estado, data_contratacao, formacao, experiencia)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Ativo',$8,$9,$10)`,
        [
          escolaId, codigo, nomeAleatorio(), aleatorio(['Masculino', 'Feminino']),
          `9${Math.floor(100000000 + Math.random() * 899999999)}`,
          `prof${i}@escola.ao`, aleatorio(ESPECIALIDADES),
          dataAleatoria(2020, 0), 'Licenciatura', `${1 + Math.floor(Math.random() * 15)} anos`,
        ]
      );
    }

    // ---- 120 MATRÍCULAS (distribuídas pelos alunos e turmas existentes) ----
    const matriculaIds = [];
    for (let i = 0; i < 120; i++) {
      const aluno = alunos[i % alunos.length];
      const turma = turmas[i % turmas.length];
      const numero = `MAT-2026-${String(proximaMat++).padStart(3, '0')}`;
      const dataMatricula = dataAleatoria(2026, 1);
      const { rows } = await client.query(
        `INSERT INTO matriculas
          (escola_id, numero, aluno_id, ano_lectivo, classe_id, turma_id, turno,
           data_matricula, taxa_matricula, estado_pagamento, estado)
         VALUES ($1,$2,$3,'2026/2027',$4,$5,$6,$7,$8,$9,'Ativa')
         RETURNING id, aluno_id`,
        [
          escolaId, numero, aluno.id, turma.classe_id, turma.id,
          aleatorio(['Manhã', 'Tarde', 'Noite']), dataMatricula,
          25000 + Math.floor(Math.random() * 10) * 1000,
          aleatorio(['Pago', 'Pendente', 'Parcial']),
        ]
      );
      matriculaIds.push(rows[0]);
    }

    // ---- 150 PAGAMENTOS (ligados aos alunos existentes) ----
    for (let i = 0; i < 150; i++) {
      const alunoId = alunos[i % alunos.length].id;
      const valor = 10000 + Math.floor(Math.random() * 40) * 1000;
      await client.query(
        `INSERT INTO pagamentos
          (aluno_id, data, valor, status, tipo, forma_pagamento, referencia, funcionario, mes_referencia)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Secretaria',$8)`,
        [
          alunoId, dataAleatoria(2026, 0), valor,
          aleatorio(['Pago', 'Pendente', 'Confirmado']), aleatorio(TIPOS_PAGAMENTO),
          aleatorio(FORMAS_PAGAMENTO), `PAG-2026-${String(i + 1).padStart(4, '0')}`,
          aleatorio(['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho']),
        ]
      );
    }

    await client.query('COMMIT');
    console.log('✔ Seed de demonstração concluído: +100 professores, +120 matrículas, +150 pagamentos.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✘ Erro no seed de demonstração:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
