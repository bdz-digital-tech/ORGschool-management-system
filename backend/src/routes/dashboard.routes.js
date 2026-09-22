const router = require('express').Router();
const c = require('../controllers/dashboardController');
const { verificarToken } = require('../middleware/auth');

router.get('/', verificarToken, c.resumo);

module.exports = router;
