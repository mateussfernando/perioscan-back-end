const jwt = require("jsonwebtoken");
const User = require("../models/User");


module.exports = async (req, res, next) => {
  const token = req.header("x-auth-token");


  if (!token) return res.status(401).json({ message: "Token não fornecido" });


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);


    // Verifica se o token está na lista de invalidados
    if (user.invalidatedTokens.includes(token)) {
      return res
        .status(401)
        .json({ message: "Token inválido (logout realizado)" });
    }


    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token inválido" });
  }
};


