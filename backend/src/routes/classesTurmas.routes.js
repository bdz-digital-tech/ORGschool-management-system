const router = require('express').Router();
const c = require('../controllers/classesTurmasController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

// Classes
router.get('/classes', c.listarClasses);
router.post('/classes', c.criarClasse);
router.put('/classes/:id', c.actualizarClasse);
router.delete('/classes/:id', c.removerClasse);

// Turmas
router.get('/turmas', c.listarTurmas);
router.get('/turmas/:id', c.obterTurma);
router.post('/turmas', c.criarTurma);
router.put('/turmas/:id', c.actualizarTurma);
router.delete('/turmas/:id', c.removerTurma);
router.post('/turmas/:id/transferir-aluno', c.transferirAluno);

module.exports = router;