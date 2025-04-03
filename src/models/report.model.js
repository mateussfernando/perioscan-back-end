import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a report title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    content: {
      type: String,
      required: [true, "Please provide report content"],
    },
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: true,
    },
    expertResponsible: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Evidence",
      },
    ],
    status: {
      type: String,
      enum: ["rascunho", "finalizado", "assinado"],
      default: "rascunho",
    },
    digitalSignature: {
      signedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      signatureDate: Date,
      signatureData: String,
    },
    // Campos adicionais para o laudo
    caseNumber: {
      type: String,
    },
    conclusion: {
      type: String,
    },
    methodology: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Report = mongoose.model("Report", reportSchema);

export default Report;
