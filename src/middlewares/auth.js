const jwt = require("jsonwebtoken");
require("dotenv").config();

// Verifica se o usuário está autenticado
const auth = (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "Token não encontrado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token inválido" });
  }
};

// Verifica se o usuário é Admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Acesso negado" });
  }
  next();
};

module.exports = { auth, isAdmin };
