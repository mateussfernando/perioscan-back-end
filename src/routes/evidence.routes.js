import express from "express";
import {
  getAllEvidence,
  getEvidence,
  createEvidence,
  updateEvidence,
  deleteEvidence,
} from "../controllers/evidence.controller.js";
import { Evidence } from "../models/evidence.model.js";
import advancedResults from "../middleware/advancedResults.middleware.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(
    advancedResults(Evidence, [
      { path: "collectedBy", select: "name email" },
      { path: "case", select: "title status" },
    ]),
    getAllEvidence
  )
  .post(authorize("admin", "perito", "assistente"), createEvidence);

router
  .route("/:id")
  .get(getEvidence)
  .put(authorize("admin", "perito", "assistente"), updateEvidence)
  .delete(authorize("admin", "perito"), deleteEvidence);

export default router;
