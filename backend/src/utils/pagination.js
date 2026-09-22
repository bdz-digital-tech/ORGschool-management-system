function getPaginationParams(query) {
  let pagina = parseInt(query.pagina, 10);
  let limite = parseInt(query.limite, 10);

  if (!Number.isInteger(pagina) || pagina < 1) pagina = 1;
  if (!Number.isInteger(limite) || limite < 1) limite = 10;
  if (limite > 1000) limite = 1000;   // <-- era 100, agora 1000

  const offset = (pagina - 1) * limite;
  return { pagina, limite, offset };
}

function buildPaginationMeta(total, pagina, limite) {
  const totalPaginas = Math.max(Math.ceil(total / limite), 1);
  return {
    total,
    pagina,
    limite,
    totalPaginas,
    temProxima: pagina < totalPaginas,
    temAnterior: pagina > 1,
  };
}

module.exports = { getPaginationParams, buildPaginationMeta };
