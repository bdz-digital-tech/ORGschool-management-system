const router = require('express').Router();
const c = require('../controllers/actividadesController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);
router.get('/', c.listar);
router.post('/', c.criar);
router.delete('/:id', c.remover);

module.exports = router;
