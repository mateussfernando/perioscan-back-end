import mongoose from "mongoose"

const evidenceReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Por favor, forneça um título para o relatório"],
      trim: true,
      maxlength: [100, "O título não pode ter mais de 100 caracteres"],
    },
    content: {
      type: String,
      required: [true, "Por favor, forneça o conteúdo do relatório"],
    },
    evidence: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evidence",
      required: true,
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
    findings: {
      type: String,
      required: [true, "Por favor, forneça as descobertas da análise"],
    },
    methodology: {
      type: String,
    },
    conclusion: {
      type: String,
    },
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
      contentHash: String,
      verificationCode: String,
    },
    // Metadados específicos para o tipo de evidência
    evidenceMetadata: {
      type: Object,
    },
    // Histórico de versões
    versions: [
      {
        content: String,
        findings: String,
        conclusion: String,
        status: String,
        modifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        modifiedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Middleware para salvar versão anterior antes de atualizar
evidenceReportSchema.pre("findOneAndUpdate", async function (next) {
  try {
    // Obter documento atual
    const docToUpdate = await this.model.findOne(this.getQuery())

    if (docToUpdate) {
      // Obter dados da atualização
      const update = this.getUpdate()

      // Se houver alterações no conteúdo, descobertas ou conclusão, salvar versão
      if (
        update.content !== undefined ||
        update.findings !== undefined ||
        update.conclusion !== undefined ||
        update.status !== undefined
      ) {
        // Criar nova versão
        const newVersion = {
          content: docToUpdate.content,
          findings: docToUpdate.findings,
          conclusion: docToUpdate.conclusion,
          status: docToUpdate.status,
          modifiedAt: new Date(),
        }

        // Adicionar usuário que está modificando, se disponível
        if (update.$set && update.$set.modifiedBy) {
          newVersion.modifiedBy = update.$set.modifiedBy
        }

        // Adicionar à lista de versões
        if (!docToUpdate.versions) {
          update.$set = update.$set || {}
          update.$set.versions = [newVersion]
        } else {
          update.$push = update.$push || {}
          update.$push.versions = newVersion
        }
      }
    }

    next()
  } catch (error) {
    next(error)
  }
})

const EvidenceReport = mongoose.model("EvidenceReport", evidenceReportSchema)

export default EvidenceReport
