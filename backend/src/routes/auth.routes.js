const router = require('express').Router();
const c = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

router.post('/setup', c.setup);
router.post('/login', c.login);
router.post('/register', verificarToken, c.registar);
router.get('/me', verificarToken, c.me);

module.exports = router;
