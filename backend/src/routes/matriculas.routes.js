const router = require('express').Router();
const c = require('../controllers/matriculasController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.get('/', c.listar);
router.get('/:id', c.obter);
router.post('/', c.criar);
router.put('/:id', c.actualizar);
router.post('/:id/transferir', c.transferir);
router.post('/:id/renovar', c.renovar);
router.patch('/:id/cancelar', c.cancelar);
router.delete('/:id', c.remover);

module.exports = router;
