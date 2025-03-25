const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/authMiddleware');

// Rotas públicas
router.post('/cadastro', AuthController.cadastroUsuario); 
router.post('/registro/membro', AuthController.registroMembro);
router.post('/login', AuthController.login);

// Rotas protegidas
router.get('/perfil', authMiddleware, AuthController.getPerfil);
router.put('/perfil', authMiddleware, AuthController.updatePerfil);

module.exports = router;