import express from "express";
import {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  exportReportPDF,
} from "../controllers/report.controller.js";
import Report from "../models/report.model.js";
import advancedResults from "../middleware/advancedResults.middleware.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(
    advancedResults(Report, [
      { path: "expertResponsible", select: "name email" },
      { path: "case", select: "title status" },
    ]),
    getReports
  )
  .post(authorize("admin", "perito"), createReport);

router
  .route("/:id")
  .get(getReport)
  .put(authorize("admin", "perito"), updateReport)
  .delete(authorize("admin", "perito"), deleteReport);

// Rota para exportar laudo como PDF
router.route("/:id/pdf").get(exportReportPDF);

export default router;
