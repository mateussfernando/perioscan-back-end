// routes/organizacaoRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const OrganizacaoController = require('../controllers/OrganizacaoController');

// Middleware para verificar admin
const isAdmin = async (req, res, next) => {
  const organizacao = await Organizacao.findById(req.params.organizacaoId);
  if (organizacao?.admin.toString() === req.user.id) return next();
  res.status(403).json({ message: 'Acesso negado' });
};

router.post('/organizacoes/:organizacaoId/usuarios', authMiddleware, isAdmin, OrganizacaoController.adicionarUsuario);
router.get('/organizacoes/:organizacaoId', authMiddleware, OrganizacaoController.obterOrganizacao);
router.post('/organizacoes/:organizacaoId/convites', authMiddleware, isAdmin, OrganizacaoController.gerarConvite);

module.exports = router;