import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import helmet from "helmet"
import morgan from "morgan"
import path from "path"
import { fileURLToPath } from "url"

// Importar configuração do Swagger
import setupSwagger from "./src/utils/swagger.js"

// Importação de rotas
import authRoutes from "./src/routes/auth.routes.js"
import userRoutes from "./src/routes/user.routes.js"
import caseRoutes from "./src/routes/case.routes.js"
import evidenceRoutes from "./src/routes/evidence.routes.js"
import reportRoutes from "./src/routes/report.routes.js"
// Rotas de comparação removidas temporariamente
// import comparisonRoutes from "./src/routes/comparison.routes.js"
import uploadRoutes from "./src/routes/upload.routes.js"
import patientRoutes from "./src/routes/patient.routes.js"
import evidenceReportRoutes from "./src/routes/evidenceReport.routes.js" // Nova importação

// Carrega variáveis de ambiente
dotenv.config()

// Inicializa aplicação express
const app = express()
const PORT = process.env.PORT || 5000

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(
  helmet({
    contentSecurityPolicy: false, // Desabilitar para o Swagger UI funcionar corretamente
  }),
)

//Configurações do swagger
setupSwagger(app)

// Middlewares

app.use(cors())

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
// Rotas de comparação removidas temporariamente
// app.use("/api/comparisons", comparisonRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/patients", patientRoutes)
app.use("/api/evidence-reports", evidenceReportRoutes) // Nova rota

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

app.get("/health", (req, res) => {
  res.status(200).send("OK")
})

// Inicia servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`)
})

export default app
