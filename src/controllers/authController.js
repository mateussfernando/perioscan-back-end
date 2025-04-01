const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();


// Tempo de expiração do token (1 hora)
const TOKEN_EXPIRES_IN = "1h";


exports.login = async (req, res) => {
  const { email, password } = req.body;


  // Validação básica dos campos
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email e senha são obrigatórios",
      errorCode: "MISSING_CREDENTIALS",
    });
  }


  try {
    // 1. Busca o usuário no banco de dados (incluindo a senha)
    const user = await User.findOne({ email }).select("+password");


    if (!user) {
      console.warn(`Tentativa de login com email não cadastrado: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas",
        errorCode: "INVALID_CREDENTIALS",
      });
    }


    // 2. Comparação segura da senha
    const isMatch = await bcrypt.compare(password, user.password);


    if (!isMatch) {
      console.warn(`Tentativa de login com senha incorreta para: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Credenciais inválidas",
        errorCode: "INVALID_CREDENTIALS",
      });
    }


    // 3. Verificação do JWT_SECRET
    if (!process.env.JWT_SECRET) {
      throw new Error("Variável JWT_SECRET não configurada no ambiente");
    }


    // 4. Geração do token JWT
    const payload = {
      id: user._id,
      role: user.role,
      email: user.email,
    };


    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: TOKEN_EXPIRES_IN,
      algorithm: "HS256",
    });


    // 5. Resposta de sucesso (remove a senha do objeto user)
    const userResponse = user.toObject();
    delete userResponse.password;


    res.status(200).json({
      success: true,
      message: "Login realizado com sucesso",
      token,
      expiresIn: TOKEN_EXPIRES_IN,
      user: userResponse,
    });
  } catch (err) {
    console.error("Erro no processo de login:", {
      error: err.message,
      stack: err.stack,
      email: email,
    });


    const statusCode = err.message.includes("JWT_SECRET") ? 500 : 400;


    res.status(statusCode).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? `Erro: ${err.message}`
          : "Erro durante o login",
      errorCode: "LOGIN_ERROR",
    });
  }
};


// Função opcional para registro de novos usuários (apenas admin)
exports.register = async (req, res) => {
  try {
    // Verifica se é um admin fazendo o registro
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Apenas administradores podem registrar novos usuários",
        errorCode: "ADMIN_REQUIRED",
      });
    }


    const { name, email, password, role } = req.body;


    // Validação dos campos
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios",
        errorCode: "MISSING_FIELDS",
      });
    }


    // Verifica se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email já cadastrado",
        errorCode: "EMAIL_EXISTS",
      });
    }


    // Cria o novo usuário
    const newUser = new User({
      name,
      email,
      password, // Será hasheado pelo pre-save hook no modelo User
      role,
    });


    await newUser.save();


    // Remove a senha antes de retornar
    const userResponse = newUser.toObject();
    delete userResponse.password;


    res.status(201).json({
      success: true,
      message: "Usuário registrado com sucesso",
      user: userResponse,
    });
  } catch (err) {
    console.error("Erro no registro:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao registrar usuário",
      errorCode: "REGISTER_ERROR",
    });
  }
};


const transporter = nodemailer.createTransport({
  service: "Gmail", // Ou outro serviço
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});


// Gerar token de reset de senha (válido por 1h)
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;


  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Email não cadastrado" });
    }


    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await user.save();


    const resetLink = `http://seusite.com/reset-password?token=${token}`;
    await transporter.sendMail({
      to: email,
      subject: "Redefinição de Senha",
      html: `Clique <a href="${resetLink}">aqui</a> para redefinir sua senha.`,
    });


    res.json({ success: true, message: "E-mail de recuperação enviado" });
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};


// Redefinir senha com token
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;


  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Token ainda válido
    });


    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Token inválido ou expirado" });
    }


    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();


    res.json({ success: true, message: "Senha redefinida com sucesso" });
  } catch (err) {
    console.error("Erro ao redefinir senha:", err);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};
