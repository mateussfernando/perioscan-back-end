const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Tentativa de login com:", email); // Debug 1

  try {
    // 1. Busca o usuário no banco de dados
    const user = await User.findOne({ email });
    console.log("Usuário encontrado:", user); // Debug 2

    if (!user) {
      console.log("Usuário não encontrado"); // Debug 3
      return res.status(400).json({
        success: false,
        message: "Credenciais inválidas",
      });
    }

    // 2. Compara a senha fornecida com o hash armazenado
    console.log("Comparando senha..."); // Debug 4
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Resultado da comparação:", isMatch); // Debug 5

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Credenciais inválidas",
      });
    }

    // 3. Gera o token JWT
    const payload = {
      id: user._id, // Alterado de user.id para user._id
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // 4. Retorna a resposta de sucesso
    res.json({
      success: true,
      message: "Login realizado com sucesso!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Erro completo no login:", err);
    res.status(500).json({
      success: false,
      message: "Erro no servidor",
    });
  }
};
