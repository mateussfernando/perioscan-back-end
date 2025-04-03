import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";

// Importação de rotas
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import caseRoutes from "./routes/case.routes.js";
import evidenceRoutes from "./routes/evidence.routes.js";
import reportRoutes from "./routes/report.routes.js";
import comparisonRoutes from "./routes/comparison.routes.js";

// Carrega variáveis de ambiente
dotenv.config();

// Inicializa aplicação express
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(helmet());
app.use(morgan("dev"));

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
app.use("/api/comparisons", comparisonRoutes);

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

// Inicia servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
