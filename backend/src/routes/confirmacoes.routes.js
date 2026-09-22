const router = require('express').Router();
const c = require('../controllers/confirmacoesController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.get('/', c.listar);
router.get('/:id', c.obter);
router.post('/', c.criar);
router.patch('/:id/confirmar', c.confirmar);
router.patch('/:id/rejeitar', c.rejeitar);
router.delete('/:id', c.remover);
router.put('/:id' , c.actualizar);

module.exports = router;
