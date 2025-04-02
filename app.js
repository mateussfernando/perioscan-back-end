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

// Conexão Moderna com MongoDB (Sem opções depreciadas)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado com sucesso (Driver v6+)"))
  .catch(err => console.error("❌ Falha na conexão com MongoDB:", err));

// Configuração de CORS otimizada
const allowedOrigins = [
  "https://glowing-enigma-97644xjvgq65h75jw-3000.app.github.dev",
  "http://localhost:3000"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  credentials: true
}));

// Middlewares
app.use(morgan("dev"));
app.use(express.json());

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    dbStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Origens permitidas:`, allowedOrigins);
});