import mongoose from "mongoose";

const comparisonResultSchema = new mongoose.Schema(
  {
    result: {
      type: String,
      required: [true, "Please provide a comparison result"],
      enum: ["match", "possible match", "no match", "inconclusive"],
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
    },
    analyzedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    analysisDate: {
      type: Date,
      default: Date.now,
    },
    sourceEvidence: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evidence",
      required: true,
    },
    targetEvidence: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evidence",
      required: true,
    },
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: true,
    },
    notes: {
      type: String,
    },
    comparisonPoints: [
      {
        sourceX: Number,
        sourceY: Number,
        targetX: Number,
        targetY: Number,
        description: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ComparisonResult = mongoose.model(
  "ComparisonResult",
  comparisonResultSchema
);

export default ComparisonResult;
