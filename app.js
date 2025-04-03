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
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Erro no MongoDB:", err));

// Configuração COMPLETA do CORS
const allowedOrigins = [
  "https://glowing-enigma-97644xjvgq65h75jw-3000.app.github.dev",
  "http://localhost:3000" // Para desenvolvimento local
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origem (como mobile apps ou curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origem não permitida por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  credentials: true
}));

// Middleware para tratamento explícito de OPTIONS
app.options('*', cors());

// Outros middlewares
app.use(morgan("dev"));
app.use(express.json());

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

// Health Check com headers CORS explícitos
app.get("/health", (req, res) => {
  res.header("Access-Control-Allow-Origin", allowedOrigins.join(", "));
  res.json({
    status: "online",
    timestamp: new Date().toISOString()
  });
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Origens permitidas:`, allowedOrigins);
});