import express from "express"
import { getCasePatients } from "../controllers/patient.controller.js"
import { getCases, getCase, createCase, updateCase, deleteCase } from "../controllers/case.controller.js"
import { getCaseEvidence } from "../controllers/evidence.controller.js"
import { getCaseReports } from "../controllers/report.controller.js"
import { getCaseComparisons } from "../controllers/comparison.controller.js"
import Case from "../models/case.model.js"
import advancedResults from "../middleware/advancedResults.middleware.js"
import { protect, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

router.use(protect)

// Case routes
router
  .route("/")
  .get(
    advancedResults(Case, [
      { path: "assignedTo", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]),
    getCases,
  )
  .post(authorize("admin", "perito"), createCase)

router
  .route("/:id")
  .get(getCase)
  .put(authorize("admin", "perito"), updateCase)
  .delete(authorize("admin", "perito"), deleteCase)

// Evidence routes for a case
router.route("/:caseId/evidence").get(getCaseEvidence)

// Report routes for a case
router.route("/:caseId/reports").get(getCaseReports)

// Comparison routes for a case
router.route("/:caseId/comparisons").get(getCaseComparisons)

// Adicionar esta rota após as rotas de comparisons
// Pacientes vinculados a um caso
router.route("/:caseId/patients").get(getCasePatients)

export default router

