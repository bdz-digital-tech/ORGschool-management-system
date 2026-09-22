const router = require('express').Router();
const c = require('../controllers/pagamentosController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.get('/', c.listar);
router.get('/:id', c.obter);
router.post('/', c.criar);
router.put('/:id', c.actualizar);
router.patch('/:id', c.actualizarStatus);
router.delete('/:id', c.remover);

module.exports = router;
