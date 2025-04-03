import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import helmet from "helmet"
import morgan from "morgan"
import path from "path"
import { fileURLToPath } from "url"

// Importação de rotas
import authRoutes from "./src/routes/auth.routes.js"
import userRoutes from "./src/routes/user.routes.js"
import caseRoutes from "./src/routes/case.routes.js"
import evidenceRoutes from "./src/routes/evidence.routes.js"
import reportRoutes from "./src/routes/report.routes.js"
import comparisonRoutes from "./src/routes/comparison.routes.js"
import uploadRoutes from "./src/routes/upload.routes.js"

// Carrega variáveis de ambiente
dotenv.config()

// Inicializa aplicação express
const app = express()
const PORT = process.env.PORT || 5000

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middlewares
app.use(cors({
  origin: [
    'https://glowing-enigma-97644xjvgq65h75jw-3000.app.github.dev',
    'http://localhost:3000'
    // Adicione outras origens conforme necessário
  ],
  credentials: true, // Importante para permitir cookies/credenciais
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use(helmet())
app.use(morgan("dev"))

// Diretório de uploads temporários
app.use(express.static(path.join(__dirname, "public")))

// Criar diretório de uploads temporários se não existir
const tempUploadDir = path.join(__dirname, "public", "uploads", "temp")
import fs from "fs"

if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true })
}

// Conexão com MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Rotas
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/cases", caseRoutes)
app.use("/api/evidence", evidenceRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/comparisons", comparisonRoutes)
app.use("/api/upload", uploadRoutes)

// Rota raiz
app.get("/", (req, res) => {
  res.send("Forensic Dental Management API is running")
})

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  })
})

// Inicia servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app

