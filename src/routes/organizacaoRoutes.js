// routes/organizacaoRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const OrganizacaoController = require('../controllers/OrganizacaoController');

// Cria organização (após cadastro inicial)
router.post('/organizacoes', authMiddleware, OrganizacaoController.criarOrganizacao);

// Entra em organização via código (após cadastro inicial)
router.post('/organizacoes/entrar', authMiddleware, OrganizacaoController.entrarOrganizacao);

module.exports = router;