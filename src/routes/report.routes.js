import express from "express"
import {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  exportReportPDF,
  signReport,
  verifyReportSignature,
  verifyReportByHash,
} from "../controllers/report.controller.js"
import Report from "../models/report.model.js"
import advancedResults from "../middleware/advancedResults.middleware.js"
import { protect, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

// Rotas públicas
router.route("/verify/:id").get(verifyReportByHash)

// Rotas protegidas
router.use(protect)

router
  .route("/")
  .get(
    advancedResults(Report, [
      { path: "expertResponsible", select: "name email" },
      { path: "case", select: "title status" },
    ]),
    getReports,
  )
  .post(authorize("admin", "perito"), createReport)

router
  .route("/:id")
  .get(getReport)
  .put(authorize("admin", "perito"), updateReport)
  .delete(authorize("admin", "perito"), deleteReport)

// Rota para exportar laudo como PDF
router.route("/:id/pdf").get(exportReportPDF)

// Rota para assinar digitalmente um laudo
router.route("/:id/sign").post(authorize("admin", "perito"), signReport)

// Rota para verificar assinatura digital
router.route("/:id/verify").get(verifyReportSignature)

export default router

