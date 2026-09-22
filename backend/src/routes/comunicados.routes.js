const router = require('express').Router();
const c = require('../controllers/comunicadosController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.get('/', c.listar);
router.post('/', c.criar);
router.put('/:id', c.actualizar);
router.patch('/:id/lido', c.marcarLido);
router.delete('/:id', c.remover);

module.exports = router;
