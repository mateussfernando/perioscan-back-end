const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware de autenticação
const auth = async (req, res, next) => {
  try {
    // Verifica se o JWT_SECRET está configurado
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não configurado no .env");
    }

    // Obtém o token do header
    const token = req.header("x-auth-token")?.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token não fornecido",
        errorCode: "MISSING_TOKEN",
      });
    }

    // Verificação do token com debug
    console.log("Token recebido:", token);
    console.log(
      "JWT_SECRET:",
      process.env.JWT_SECRET ? "Configurado" : "Faltando"
    );

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // Verificação adicional do payload
    if (!decoded.id || !decoded.role) {
      throw new Error("Estrutura do token inválida");
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("Erro completo:", {
      message: err.message,
      stack: err.stack,
      token: err.token || "Não disponível",
    });

    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? `Erro: ${err.message}`
          : "Erro no servidor",
      errorCode: "AUTH_ERROR",
    });
  }
};

// Middleware de autorização para admin
const isAdmin = (req, res, next) => {
  try {
    // 1. Verificação robusta do usuário
    if (!req.user || !req.user.role) {
      console.error("Dados de usuário ausentes na requisição");
      return res.status(403).json({
        success: false,
        message: "Autenticação necessária",
        errorCode: "AUTH_REQUIRED",
      });
    }

    // 2. Verificação de perfil admin
    if (req.user.role !== "admin") {
      console.warn(`Tentativa de acesso não autorizado por: ${req.user.id}`);
      return res.status(403).json({
        success: false,
        message: "Acesso restrito a administradores",
        errorCode: "ADMIN_REQUIRED",
        currentRole: req.user.role,
      });
    }

    console.log(`Acesso admin concedido para: ${req.user.id}`);
    next();
  } catch (err) {
    console.error("Erro na autorização:", err);
    res.status(500).json({
      success: false,
      message: "Erro interno na verificação de permissões",
      errorCode: "AUTH_SERVER_ERROR",
    });
  }
};

module.exports = { auth, isAdmin };
