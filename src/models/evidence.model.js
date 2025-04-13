import mongoose from "mongoose"

const evidenceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "text"],
      required: [true, "Please specify evidence type"],
    },
    collectionDate: {
      type: Date,
      default: Date.now,
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    
    location: {
      type: String,
      trim: true,
      default: null,
    },
    
    imageUrl: {
      type: String,
    },
    // Informações do Cloudinary
    cloudinary: {
      public_id: String,
      url: String,
      format: String,
      width: Number,
      height: Number,
      bytes: Number,
    },
    // Para evidência de texto
    content: {
      type: String,
    },
    // Metadados para a evidência
    metadata: {
      type: Object,
    },
  },
  {
    timestamps: true,
    discriminatorKey: "evidenceType",
  },
)

const Evidence = mongoose.model("Evidence", evidenceSchema)

// Discriminador para evidência de imagem
const ImageEvidence = Evidence.discriminator(
  "ImageEvidence",
  new mongoose.Schema({
    imageUrl: {
      type: String,
      required: [true, "Please provide an image URL"],
    },
    imageType: {
      type: String,
      enum: ["radiografia", "fotografia", "odontograma", "outro"],
      default: "outro",
    },
    annotations: [
      {
        x: Number,
        y: Number,
        text: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  }),
)

// Discriminador para evidência de texto
const TextEvidence = Evidence.discriminator(
  "TextEvidence",
  new mongoose.Schema({
    content: {
      type: String,
      required: [true, "Please provide text content"],
    },
    contentType: {
      type: String,
      enum: ["relato", "depoimento", "descrição técnica", "outro"],
      default: "outro",
    },
  }),
)

export { Evidence, ImageEvidence, TextEvidence }
