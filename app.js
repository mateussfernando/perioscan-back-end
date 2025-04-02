require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

// Import das rotas da aplicação
const authRoutes = require("./src/routes/auth");
const adminRoutes = require("./src/routes/admin");
const userRoutes = require("./src/routes/user");

// Configuração Inicial
const app = express();
const PORT = process.env.PORT || 3337;

// Conexão com o MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado ao MongoDB"))
  .catch((err) => console.error("❌ Erro na conexão com MongoDB:", err));

// Configuração de CORS (Ajustada para seu front-end)
const allowedOrigins = [
  "https://glowing-enigma-97644xjvgq65h75jw-3000.app.github.dev", // Seu front-end atual
  "http://localhost:3000", // Para desenvolvimento local
  // Adicione outros domínios conforme necessário
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite requisições sem 'origin' (ex: mobile apps)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Acesso bloqueado por política de CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
    credentials: true
  })
);

// Middlewares
app.use(morgan("dev"));
app.use(express.json());

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);

// Rota Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Rota raiz
app.get("/", (req, res) => {
  res.end("Servidor operacional");
});

// Inicia servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(`Origens permitidas: ${allowedOrigins.join(", ")}`);
}); 
