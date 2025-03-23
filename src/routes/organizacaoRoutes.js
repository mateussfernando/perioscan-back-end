const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const OrganizacaoController = require('../controllers/OrganizacaoController');

// Rota para adicionar usuário à organização (apenas Admin)
router.post(
  '/organizacoes/:organizacaoId/usuarios', 
  authMiddleware, 
  OrganizacaoController.adicionarUsuario
);

module.exports = router;