require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

// Import das rotas
const authRoutes = require("./src/routes/auth");
const adminRoutes = require("./src/routes/admin");
const userRoutes = require("./src/routes/user");

const app = express();
const PORT = process.env.PORT || 3337;

// Conexão com MongoDB com opções modernas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log("✅ MongoDB conectado com sucesso"))
.catch(err => console.error("❌ Falha na conexão com MongoDB:", err));

// Configuração EXTENDIDA de CORS (Solução Definitiva)
const allowedOrigins = [
  "https://glowing-enigma-97644xjvgq65h75jw-3000.app.github.dev",
  "http://localhost:3000",
  "https://perioscan-frontend.onrender.com" // Adicione seu futuro domínio de produção
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin); // Dynamic origin
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
  }
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

// Middlewares essenciais
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

// Rota Health Check melhorada
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    memoryUsage: process.memoryUsage(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Rota raiz com informações úteis
app.get("/", (req, res) => {
  res.json({
    message: "API Perioscan Backend",
    version: "1.0.0",
    docs: "/api-docs", // Sugestão para futura documentação
    status: "operational"
  });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error("🛑 Erro:", err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Ocorreu um erro"
  });
});

// Inicia servidor com tratamento de erros
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Origens permitidas: ${allowedOrigins.join(", ")}`);
});

// Tratamento de erros não capturados
process.on("unhandledRejection", (err) => {
  console.error("⚠️ Erro não tratado:", err);
  server.close(() => process.exit(1));
});