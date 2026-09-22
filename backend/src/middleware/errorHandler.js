class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  // Violações de constraint do PostgreSQL
  if (err.code === '23505') {
    return res.status(409).json({ erro: 'Registo duplicado (valor já existe).', detalhe: err.detail });
  }
  if (err.code === '23503') {
    return res.status(409).json({ erro: 'Referência inválida — registo relacionado não existe.', detalhe: err.detail });
  }
  if (err.code === '23514') {
    return res.status(400).json({ erro: 'Valor não permitido para este campo.', detalhe: err.detail });
  }
  if (err.code === '22P02') {
    return res.status(400).json({ erro: 'Formato de dado inválido.', detalhe: err.message });
  }

  const status = err.status || 500;
  res.status(status).json({
    erro: err.message || 'Erro interno do servidor',
    ...(err.details ? { detalhes: err.details } : {}),
  });
}

function notFound(req, res) {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound, ApiError };
