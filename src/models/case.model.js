import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a case title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a case description"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["em andamento", "finalizado", "arquivado"],
      default: "em andamento",
    },
    openDate: {
      type: Date,
      default: Date.now,
    },
    closeDate: {
      type: Date,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual para evidências
caseSchema.virtual("evidence", {
  ref: "Evidence",
  localField: "_id",
  foreignField: "case",
  justOne: false,
});

// Virtual para laudos
caseSchema.virtual("reports", {
  ref: "Report",
  localField: "_id",
  foreignField: "case",
  justOne: false,
});

const Case = mongoose.model("Case", caseSchema);

export default Case;
