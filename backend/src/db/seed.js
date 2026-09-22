require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const CLASSES = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe', '7ª Classe', '8ª Classe', '9ª Classe'];
const TURMAS = ['A', 'B', 'C'];
const ANO_LECTIVO = '2026/2027';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Escola de demonstração (idempotente: não duplica se já existir)
    let escolaId;
    const escolaExistente = await client.query(`SELECT id FROM escolas WHERE nome = $1`, ['Complexo Escolar Privado Júlia']);
    if (escolaExistente.rows.length > 0) {
      escolaId = escolaExistente.rows[0].id;
    } else {
      const { rows } = await client.query(
        `INSERT INTO escolas (nome, email) VALUES ($1, $2) RETURNING id`,
        ['Complexo Escolar Privado Júlia', 'complexoescolarprivadojulia@gmail.com']
      );
      escolaId = rows[0].id;
    }

    // Utilizador admin de demonstração
    const adminExistente = await client.query(`SELECT id FROM usuarios WHERE email = $1`, ['julia@gmail.ao']);
    if (adminExistente.rows.length === 0) {
      const senhaHash = await bcrypt.hash('102030', 10);
      await client.query(
        `INSERT INTO usuarios (nome, email, senha_hash, role, escola_id) VALUES ($1,$2,$3,'admin',$4)`,
        ['Administrador', 'julia@gmail.ao', senhaHash, escolaId]
      );
      console.log('Utilizador demo criado — email: julia@gmail.ao | senha: 102030');
    }

    for (const nome of CLASSES) {
      const { rows } = await client.query(
        `INSERT INTO classes (escola_id, nome, ano_lectivo) VALUES ($1, $2, $3)
         ON CONFLICT (escola_id, nome, ano_lectivo) DO UPDATE SET nome = EXCLUDED.nome
         RETURNING id`,
        [escolaId, nome, ANO_LECTIVO]
      );
      const classeId = rows[0].id;

      for (const turmaNome of TURMAS) {
        await client.query(
          `INSERT INTO turmas (escola_id, nome, classe_id, turno, capacidade_maxima)
           VALUES ($1, $2, $3, 'Manhã', 30)
           ON CONFLICT (classe_id, nome) DO NOTHING`,
          [escolaId, turmaNome, classeId]
        );
      }
    }
    
/*
    await client.query(
      `INSERT INTO comunicados (escola_id, icon, titulo, destinatario, status) VALUES
        ($1, 'bi bi-building', 'Reunião de pais', 'Todos', 'Publicado'),
        ($1, 'bi bi-calendar-check', 'Calendário de provas', 'Todos', 'Publicado')
      ON CONFLICT DO NOTHING`,
      [escolaId]
    );

*/
    await client.query('COMMIT');
    console.log('✔ Seed concluído: escola demo, admin, classes, turmas e comunicados inseridos.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✘ Erro no seed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
