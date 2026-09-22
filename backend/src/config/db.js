const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'colegio_julia',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '8101',
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões PostgreSQL:', err);
});

module.exports = pool;
