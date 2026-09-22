async function nextCode(client, { table, column = 'codigo', prefix, ano, escolaId }) {
  const year = ano || String(new Date().getFullYear());
  const pattern = `${prefix}-${year}-%`;

  const { rows } = await client.query(
    `SELECT ${column} FROM ${table}
     WHERE ${column} LIKE $1 AND escola_id = $2
     ORDER BY ${column} DESC
     LIMIT 1`,
    [pattern, escolaId]
  );

  let nextSeq = 1;
  if (rows.length > 0) {
    const parts = rows[0][column].split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${prefix}-${year}-${String(nextSeq).padStart(3, '0')}`;
}

module.exports = { nextCode };
