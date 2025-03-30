const express = require("express");
const router = express.Router();
const { createUser, listUsers } = require("../controllers/adminController");
const { auth, isAdmin } = require("../middlewares/auth");
const { deleteUser } = require("../controllers/userController");

router.post("/users", auth, isAdmin, createUser);
router.get("/users", auth, isAdmin, listUsers);
router.delete("/users/:id", auth, isAdmin, deleteUser);

module.exports = router;
