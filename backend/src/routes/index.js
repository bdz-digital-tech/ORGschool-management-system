const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/escolas', require('./escolas.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/alunos', require('./alunos.routes'));
router.use('/professores', require('./professores.routes'));
router.use('/matriculas', require('./matriculas.routes'));
router.use('/pagamentos', require('./pagamentos.routes'));
router.use('/comunicados', require('./comunicados.routes'));
router.use('/confirmacoes', require('./confirmacoes.routes'));
router.use('/actividades', require('./actividades.routes'));
router.use('/', require('./classesTurmas.routes'));

module.exports = router;
