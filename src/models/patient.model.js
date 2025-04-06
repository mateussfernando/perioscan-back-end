import mongoose from "mongoose"

const patientSchema = new mongoose.Schema(
  {
    // Campos comuns para todos os pacientes
    patientType: {
      type: String,
      enum: ["identificado", "não identificado"],
      required: [true, "Tipo de paciente é obrigatório"],
    },
    // Campos para pacientes identificados
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Nome não pode ter mais de 100 caracteres"],
    },
    birthDate: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["masculino", "feminino", "outro", "não informado"],
      default: "não informado",
    },
    cpf: {
      type: String,
      trim: true,
      sparse: true, // Permite que seja único apenas quando presente
    },
    // Campos para pacientes não identificados
    referenceCode: {
      type: String,
      trim: true,
    },
    estimatedAge: {
      type: String, // Faixa etária estimada
      trim: true,
    },
    estimatedGender: {
      type: String,
      enum: ["masculino", "feminino", "indeterminado"],
      default: "indeterminado",
    },
    foundLocation: {
      type: String,
      trim: true,
    },
    foundDate: {
      type: Date,
    },
    // Informações odontológicas simplificadas
    dentalFeatures: [
      {
        toothNumber: {
          type: String, // Notação FDI (ISO 3950)
          required: [true, "Número do dente é obrigatório"],
        },
        description: {
          type: String,
          required: [true, "Descrição da característica é obrigatória"],
        },
        type: {
          type: String,
          enum: ["restauração", "ausência", "prótese", "implante", "tratamento endodôntico", "anomalia", "outro"],
          default: "outro",
        },
        notes: String,
        recordedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        recordedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Casos relacionados
    cases: [
      {
        caseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Case",
        },
        relationshipType: {
          type: String,
          enum: ["vítima", "suspeito", "referência", "outro"],
          default: "outro",
        },
        notes: String,
      },
    ],
    status: {
      type: String,
      enum: ["ativo", "arquivado", "identificado", "pendente"],
      default: "ativo",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Índices para melhorar a performance das consultas
patientSchema.index({ patientType: 1, status: 1 })
patientSchema.index({ name: 1 })
patientSchema.index({ cpf: 1 }, { sparse: true })
patientSchema.index({ referenceCode: 1 }, { sparse: true })
patientSchema.index({ "cases.caseId": 1 })

// Middleware para validar campos baseados no tipo de paciente
patientSchema.pre("validate", function (next) {
  if (this.patientType === "identified") {
    // Pacientes identificados devem ter nome
    if (!this.name) {
      this.invalidate("name", "Nome é obrigatório para pacientes identificados")
    }
  } else if (this.patientType === "unidentified") {
    // Pacientes não identificados devem ter código de referência
    if (!this.referenceCode) {
      this.invalidate("referenceCode", "Código de referência é obrigatório para pacientes não identificados")
    }
  }
  next()
})

// Método para vincular paciente a um caso
patientSchema.methods.addCase = function (caseId, relationshipType = "outro", notes = "") {
  // Verificar se o caso já está vinculado
  const existingCase = this.cases.find((c) => c.caseId.toString() === caseId.toString())

  if (existingCase) {
    // Atualizar informações se já existir
    existingCase.relationshipType = relationshipType
    existingCase.notes = notes
  } else {
    // Adicionar novo caso
    this.cases.push({
      caseId,
      relationshipType,
      notes,
    })
  }

  return this
}

// Método para adicionar característica odontológica
patientSchema.methods.addDentalFeature = function (toothNumber, description, type, notes, userId) {
  this.dentalFeatures.push({
    toothNumber,
    description,
    type,
    notes,
    recordedBy: userId,
    recordedAt: Date.now(),
  })

  return this
}

const Patient = mongoose.model("Patient", patientSchema)

export default Patient

