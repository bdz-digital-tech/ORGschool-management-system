const router = require('express').Router();
const c = require('../controllers/professoresController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.get('/', c.listar);
router.get('/:id', c.obter);
router.post('/', c.criar);
router.put('/:id', c.actualizar);
router.patch('/:id/estado', c.alterarEstado);
router.delete('/:id', c.remover);

router.post('/:id/turmas', c.adicionarTurma);
router.delete('/:id/turmas/:turmaId', c.removerTurma);
router.post('/:id/disciplinas', c.adicionarDisciplina);
router.delete('/:id/disciplinas/:disciplinaId', c.removerDisciplina);
router.post('/:id/classes', c.adicionarClasse);
router.delete('/:id/classes/:classeAssocId', c.removerClasse);

module.exports = router;
