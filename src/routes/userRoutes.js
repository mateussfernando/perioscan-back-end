const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const UserController = require('../controllers/UserController');

// Rotas protegidas
router.get('/me', authMiddleware, UserController.getPerfil);
router.put('/me', authMiddleware, UserController.updatePerfil);
router.get('/usuarios', authMiddleware, UserController.listarTodosUsuarios);

module.exports = router;