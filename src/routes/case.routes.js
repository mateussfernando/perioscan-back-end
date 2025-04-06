// routes/case.routes.js

import express from "express";
import {
  getCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  getCaseStats,
  searchCases
} from "../controllers/case.controller.js";
import { getCaseEvidence } from "../controllers/evidence.controller.js";
import { getCaseReports } from "../controllers/report.controller.js";
import { getCaseComparisons } from "../controllers/comparison.controller.js";
import Case from "../models/case.model.js";
import advancedResults from "../middleware/advancedResults.middleware.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// Rota para estatísticas
router.get("/stats", getCaseStats);

// Rota para busca avançada
router.post("/search", searchCases);

// Rotas de casos
router
  .route("/")
  .get(
    advancedResults(Case, [
      { path: "assignedTo", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]),
    getCases
  )
  .post(authorize("admin", "perito"), createCase);

router
  .route("/:id")
  .get(getCase)
  .put(authorize("admin", "perito"), updateCase)
  .delete(authorize("admin", "perito"), deleteCase);

// Evidências para um caso
router.route("/:caseId/evidence").get(getCaseEvidence);

// Laudos para um caso
router.route("/:caseId/reports").get(getCaseReports);

// Comparações para um caso
router.route("/:caseId/comparisons").get(getCaseComparisons);

export default router;