require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

// Import das rotas da aplicação
const authRoutes = require("./src/routes/auth");
const adminRoutes = require("./src/routes/admin");

//Configuração Inicial
const app = express();
const PORT = process.env.PORT || 3337;

// Conexão com o MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro na conexão com MongoDB:", err));

  const corsOptions = {
    origin: process.env.CLIENT_URL || "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  };
  
  app.use(cors(corsOptions));
  
app.use(morgan("dev"));
app.use(express.json());

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Rota Health para teste da conexão
app.get("/health", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

//Iniciar servidor
app.get("/", (req, res) => {
  res.end("O servidor esta rodando");
});
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
});
