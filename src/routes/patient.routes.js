import express from "express"
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  addCaseToPatient,
  removeCaseFromPatient,
  addDentalFeature,
  searchByDentalFeatures,
} from "../controllers/patient.controller.js"
import Patient from "../models/patient.model.js"
import advancedResults from "../middleware/advancedResults.middleware.js"
import { protect, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

router.use(protect)

// Rota para busca por características odontológicas
router.post("/search/dental", searchByDentalFeatures)

// Rotas principais
router
  .route("/")
  .get(
    advancedResults(Patient, [
      { path: "createdBy", select: "name email" },
      { path: "cases.caseId", select: "title status" },
    ]),
    getPatients,
  )
  .post(authorize("admin", "perito"), createPatient)

router
  .route("/:id")
  .get(getPatient)
  .put(authorize("admin", "perito"), updatePatient)
  .delete(authorize("admin", "perito"), deletePatient)

// Rotas para vincular/desvincular casos
router.route("/:id/cases").post(authorize("admin", "perito"), addCaseToPatient)

router.route("/:id/cases/:caseId").delete(authorize("admin", "perito"), removeCaseFromPatient)

// Rota para adicionar características odontológicas
router.route("/:id/dental-features").post(authorize("admin", "perito"), addDentalFeature)

export default router

