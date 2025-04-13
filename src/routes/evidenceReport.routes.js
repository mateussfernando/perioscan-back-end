import express from "express"
import {
  getEvidenceReports,
  getEvidenceReport,
  createEvidenceReport,
  updateEvidenceReport,
  deleteEvidenceReport,
  exportEvidenceReportPDF,
  signEvidenceReport,
  verifyEvidenceReportSignature,
  verifyEvidenceReportByHash,
} from "../controllers/evidenceReport.controller.js"
import EvidenceReport from "../models/evidenceReport.model.js"
import advancedResults from "../middleware/advancedResults.middleware.js"
import { protect, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

// Rota pública para verificação de relatórios
router.route("/verify/:id").get(verifyEvidenceReportByHash)

// Rotas protegidas
router.use(protect)

router
  .route("/")
  .get(
    advancedResults(EvidenceReport, [
      { path: "evidence", select: "type description imageUrl" },
      { path: "case", select: "title status" },
      { path: "expertResponsible", select: "name email" },
    ]),
    getEvidenceReports,
  )
  .post(authorize("admin", "perito"), createEvidenceReport)

router
  .route("/:id")
  .get(getEvidenceReport)
  .put(authorize("admin", "perito"), updateEvidenceReport)
  .delete(authorize("admin", "perito"), deleteEvidenceReport)

router.route("/:id/pdf").get(exportEvidenceReportPDF)
router.route("/:id/sign").post(authorize("admin", "perito"), signEvidenceReport)
router.route("/:id/verify").get(verifyEvidenceReportSignature)

export default router
