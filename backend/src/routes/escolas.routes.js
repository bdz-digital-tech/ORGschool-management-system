const router = require('express').Router();
const c = require('../controllers/escolasController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.get('/', c.listar);
router.get('/:id', c.obter);
router.put('/:id', c.actualizar);

module.exports = router;
