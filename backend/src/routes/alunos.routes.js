const router = require('express').Router();
const c = require('../controllers/alunosController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.get('/pesquisa', c.pesquisar);

router.get('/', c.listar);
router.get('/:id', c.obter);
router.post('/', c.criar);
router.put('/:id', c.actualizar);
router.patch('/:id/estado', c.alterarEstado);
router.delete('/:id', c.remover);

router.get('/:id/documentos', c.listarDocumentos);
router.post('/:id/documentos', c.adicionarDocumento);
router.delete('/:id/documentos/:docId', c.removerDocumento);

router.get('/:id/historico', c.listarHistorico);

module.exports = router;
