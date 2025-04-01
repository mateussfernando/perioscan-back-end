const express = require("express");
const router = express.Router();
const {
  login,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/authController");

router.post("/login", login);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

module.exports = router;