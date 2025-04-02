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

// Conexão com MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Erro no MongoDB:", err));

// CORS PERMITINDO TUDO (TESTES)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"]
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
    timestamp: new Date().toISOString()
  });
});

// Rota raiz
app.get("/", (req, res) => res.send("Backend Online"));

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});