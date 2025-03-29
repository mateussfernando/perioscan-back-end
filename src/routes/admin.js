const express = require("express");
const router = express.Router();
const { createUser, listUsers } = require("../controllers/adminController");
const { auth, isAdmin } = require("../middlewares/auth");

router.post("/users", auth, isAdmin, createUser);
router.get("/users", auth, isAdmin, listUsers);

module.exports = router;
