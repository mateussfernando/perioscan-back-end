const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const logoutController = require("../controllers/logoutController");
const { auth } = require("../middlewares/auth");


// Rotas de autenticação
router.post("/login", authController.login);
router.post("/logout", auth, logoutController.logout);
router.post("/forgot-password", authController.requestPasswordReset);
router.post("/reset-password", authController.resetPassword);

module.exports = router;