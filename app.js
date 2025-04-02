require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");

// Import das rotas
const authRoutes = require("./src/routes/auth");
const adminRoutes = require("./src/routes/admin");
const userRoutes = require("./src/routes/user");

const app = express();
const PORT = process.env.PORT || 3337;

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Erro no MongoDB:", err));

// =============================================
// SOLUÇÃO DEFINITIVA PARA CORS (3 CAMADAS)
// =============================================

// 1. Middleware CORS manual para todas as rotas
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", 
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token");
  
  // Responde imediatamente a requisições OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

// 2. Middleware CORS do pacote cors (redundância)
const cors = require("cors");
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["*"],
  exposedHeaders: ["x-auth-token"]
}));

// 3. Handler global para OPTIONS (segurança extra)
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  res.status(200).send();
});

// =============================================
// CONFIGURAÇÃO RESTANTE
// =============================================

// Middlewares
app.use(morgan("dev"));
app.use(express.json());

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

// Health Check reforçado
app.get("/health", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*"); // Header manual extra
  res.json({ 
    status: "online",
    timestamp: new Date().toISOString(),
    cors: {
      allowedOrigins: "Todas (*)",
      methods: "GET, POST, PUT, DELETE, OPTIONS"
    }
  });
});

// Rota raiz com CORS explícito
app.get("/", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.send("Backend Online - CORS Liberado");
});

// Inicia servidor com verificação
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log("🔧 Configuração CORS:");
  console.log("👉 Access-Control-Allow-Origin: *");
  console.log("👉 Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
  console.log("👉 Access-Control-Allow-Headers: *");
});