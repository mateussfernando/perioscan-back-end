const express = require("express");
const router = express.Router();
const { updateProfile } = require("../controllers/userController");
const { auth } = require("../middlewares/auth");

router.put("/profile", auth, updateProfile);

module.exports = router;