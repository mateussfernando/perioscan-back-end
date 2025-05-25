import express from "express";
import {
  getVictims,
  getVictim,
  createVictim,
  updateVictim,
  deleteVictim,
  addCaseToVictim,
  removeCaseFromVictim,
  addEvidenceToVictim,
  removeEvidenceFromVictim,
  updateTooth,
  addDentalFeature,
  searchByOdontogram,
  addAnatomicalRegion,
  updateAnatomicalRegion,
  removeAnatomicalRegion,
  getAnatomicalRegions,
  updateOdontogramAnnotations,
} from "../controllers/victim.controller.js";
import Victim from "../models/victim.model.js";
import advancedResults from "../middleware/advancedResults.middleware.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

// Remova a opção mergeParams que não é necessária para rotas convencionais
const router = express.Router();

router.use(protect);

// Rota para busca por características odontológicas
router.post("/search/odontogram", searchByOdontogram);

// Rotas principais
router
  .route("/")
  .get(
    advancedResults(Victim, [
      { path: "createdBy", select: "name email" },
      { path: "updatedBy", select: "name email" },
      { path: "cases.caseId", select: "title status" },
    ]),
    getVictims
  )
  .post(authorize("admin", "perito"), createVictim);

router
  .route("/:id")
  .get(getVictim)
  .put(authorize("admin", "perito"), updateVictim)
  .delete(authorize("admin", "perito"), deleteVictim);

// Rotas para vincular/desvincular casos
router.route("/:id/cases").post(authorize("admin", "perito"), addCaseToVictim);
router
  .route("/:id/cases/:caseId")
  .delete(authorize("admin", "perito"), removeCaseFromVictim);

// Rotas para vincular/desvincular evidências
router
  .route("/:id/evidences")
  .post(authorize("admin", "perito"), addEvidenceToVictim);
router
  .route("/:id/evidences/:evidenceId")
  .delete(authorize("admin", "perito"), removeEvidenceFromVictim);

// Rotas para o odontograma
router
  .route("/:id/odontogram/:toothNumber")
  .put(authorize("admin", "perito"), updateTooth);

// Rotas para características odontológicas
router
  .route("/:id/dental-features")
  .post(authorize("admin", "perito"), addDentalFeature);

// Rotas para regiões anatômicas
router.post(
  "/:id/anatomical-regions",
  protect,
  authorize("admin", "perito"),
  addAnatomicalRegion
);

router.put(
  "/:id/anatomical-regions/:regionId",
  protect,
  authorize("admin", "perito"),
  updateAnatomicalRegion
);

router.delete(
  "/:id/anatomical-regions/:regionId",
  protect,
  authorize("admin", "perito"),
  removeAnatomicalRegion
);

router.get(
  "/:id/anatomical-regions",
  protect,
  getAnatomicalRegions
);

// Rota para atualizar anotações do odontograma
router.put(
  "/:id/odontogram/annotations",
  protect,
  authorize("admin", "perito"),
  updateOdontogramAnnotations
);

export default router;
