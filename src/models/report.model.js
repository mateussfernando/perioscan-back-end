import mongoose from "mongoose"

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
      contentHash: String,
      verificationCode: String,
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
    // Histórico de versões
    versions: [
      {
        content: String,
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
reportSchema.pre("findOneAndUpdate", async function (next) {
  try {
    // Obter documento atual
    const docToUpdate = await this.model.findOne(this.getQuery())

    if (docToUpdate) {
      // Obter dados da atualização
      const update = this.getUpdate()

      // Se houver alterações no conteúdo ou conclusão, salvar versão
      if (update.content !== undefined || update.conclusion !== undefined || update.status !== undefined) {
        // Criar nova versão
        const newVersion = {
          content: docToUpdate.content,
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

const Report = mongoose.model("Report", reportSchema)

export default Report

