import express from "express";
import {
  getComparisons,
  getComparison,
  createComparison,
  updateComparison,
  deleteComparison,
} from "../controllers/comparison.controller.js";
import ComparisonResult from "../models/comparison.model.js";
import advancedResults from "../middleware/advancedResults.middleware.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(
    advancedResults(ComparisonResult, [
      { path: "analyzedBy", select: "name email" },
      { path: "case", select: "title status" },
      { path: "sourceEvidence" },
      { path: "targetEvidence" },
    ]),
    getComparisons
  )
  .post(authorize("admin", "perito"), createComparison);

router
  .route("/:id")
  .get(getComparison)
  .put(authorize("admin", "perito"), updateComparison)
  .delete(authorize("admin", "perito"), deleteComparison);

export default router;
