require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

//Configuração Inicial
const app = express();
const PORT = process.env.PORT || 3337;

// Conexão com o MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro na conexão com MongoDB:", err));

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

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
