import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// Importar configuração do Swagger
import setupSwagger from "./src/utils/swagger.js";

// Importação de rotas
import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import caseRoutes from "./src/routes/case.routes.js";
import evidenceRoutes from "./src/routes/evidence.routes.js";
import reportRoutes from "./src/routes/report.routes.js";

import uploadRoutes from "./src/routes/upload.routes.js";
// Removida importação de patientRoutes
import evidenceReportRouter from "./src/routes/evidenceReport.routes.js"; // Nova importação

// Adicione a importação das rotas de victim abaixo das outras importações de rotas
import victimRoutes from "./src/routes/victim.routes.js";

// Carrega variáveis de ambiente
dotenv.config();

// Inicializa aplicação express
const app = express();
const PORT = process.env.PORT || 5000;

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS deve vir antes de tudo
app.use(
  cors({
    origin: ["https://perioscan.netlify.app"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  helmet({
    contentSecurityPolicy: false, // Desabilitar para o Swagger UI funcionar corretamente
  })
);
app.use(morgan("dev"));

//Configurações do swagger
setupSwagger(app);

// Diretório de uploads temporários
app.use(express.static(path.join(__dirname, "public")));

// Criar diretório de uploads temporários se não existir
const tempUploadDir = path.join(__dirname, "public", "uploads", "temp");
import fs from "fs";

if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Conexão com MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/reports", reportRoutes);

app.use("/api/upload", uploadRoutes);
// Removida rota de patients
app.use("/api/evidence-reports", evidenceReportRouter);

// Adicione a linha que configura as rotas de victim abaixo das outras rotas
app.use("/api/victims", victimRoutes);

// Rota raiz
app.get("/", (req, res) => {
  res.send("Forensic Dental Management API is running");
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Swagger documentation available at http://localhost:${PORT}/api-docs`
  );
});

export default app;
