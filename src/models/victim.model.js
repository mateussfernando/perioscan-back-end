import mongoose from "mongoose";

// Schema para cada dente do odontograma
const toothSchema = new mongoose.Schema({
  number: {
    type: String, // Notação FDI (ISO 3950)
    required: [true, "Número do dente é obrigatório"],
  },
  status: {
    type: String,
    enum: [
      "presente",
      "ausente_ante_mortem",
      "ausente_post_mortem",
      "não_erupcionado",
      "implante",
      "prótese",
      "não_avaliado",
    ],
    default: "não_avaliado",
  },
  restorations: [
    {
      surface: {
        type: String,
        enum: [
          "oclusal",
          "vestibular",
          "lingual",
          "mesial",
          "distal",
          "incisal",
          "cervical",
          "coroa_total",
        ],
        required: true,
      },
      material: {
        type: String,
        enum: ["amálgama", "resina", "ionômero", "cerâmica", "ouro", "outro"],
        required: true,
      },
      notes: String,
    },
  ],
  rootCanal: {
    type: Boolean,
    default: false,
  },
  crown: {
    type: String,
    enum: ["não", "metálica", "metalocerâmica", "cerâmica", "resina", "outro"],
    default: "não",
  },
  anomalies: String,
  fractures: String,
  wear: String,
  discoloration: String,
  annotations: {
    type: String,
    trim: true,
    maxlength: [500, "Anotações não podem ter mais de 500 caracteres"],
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  lastUpdate: {
    type: Date,
    default: Date.now,
  },
});

// Schema para anotações de regiões anatômicas
const anatomicalRegionSchema = new mongoose.Schema({
  region: {
    type: String,
    enum: [
      "crânio",
      "face",
      "mandíbula",
      "maxila",
      "articulação_temporomandibular",
      "seios_paranasais",
      "cavidade_oral",
      "língua",
      "palato",
      "gengiva",
      "mucosa_oral",
      "glândulas_salivares",
      "músculos_faciais",
      "nervos_faciais",
      "vasos_sanguíneos",
      "linfonodos",
      "outro",
    ],
    required: [true, "Região anatômica é obrigatória"],
  },
  description: {
    type: String,
    required: [true, "Descrição da região é obrigatória"],
    trim: true,
    maxlength: [1000, "Descrição não pode ter mais de 1000 caracteres"],
  },
  findings: {
    type: String,
    trim: true,
    maxlength: [1000, "Achados não podem ter mais de 1000 caracteres"],
  },
  pathologies: {
    type: String,
    trim: true,
    maxlength: [500, "Patologias não podem ter mais de 500 caracteres"],
  },
  annotations: {
    type: String,
    trim: true,
    maxlength: [500, "Anotações não podem ter mais de 500 caracteres"],
  },
  images: [
    {
      url: String,
      description: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

const victimSchema = new mongoose.Schema(
  {
    // NIC (Número de Identificação Criminal)
    nic: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      maxlength: [20, "NIC não pode ter mais de 20 caracteres"],
    },

    // Nome completo da vítima
    name: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
      maxlength: [200, "Nome não pode ter mais de 200 caracteres"],
    },

    // Gênero
    gender: {
      type: String,
      enum: ["masculino", "feminino", "indeterminado"],
      required: [true, "Gênero é obrigatório"],
      default: "indeterminado",
    },

    // Idade
    age: {
      type: Number,
      min: [0, "Idade não pode ser negativa"],
      max: [150, "Idade não pode ser maior que 150 anos"],
    },
    birthDate: {
      type: Date,
    },
    estimatedAge: {
      min: {
        type: Number,
        min: [0, "Idade mínima estimada não pode ser negativa"],
      },
      max: {
        type: Number,
        max: [150, "Idade máxima estimada não pode ser maior que 150 anos"],
      },
      methodology: {
        type: String,
        trim: true,
        maxlength: [200, "Metodologia não pode ter mais de 200 caracteres"],
      },
    },

    // Documento de identificação
    document: {
      type: {
        type: String,
        enum: [
          "cpf",
          "rg",
          "cnh",
          "passaporte",
          "certidao_nascimento",
          "outro",
        ],
      },
      number: {
        type: String,
        trim: true,
        maxlength: [
          50,
          "Número do documento não pode ter mais de 50 caracteres",
        ],
      },
      issuer: {
        type: String,
        trim: true,
        maxlength: [100, "Órgão emissor não pode ter mais de 100 caracteres"],
      },
      issueDate: {
        type: Date,
      },
    },

    // Endereço completo
    address: {
      street: {
        type: String,
        trim: true,
        maxlength: [200, "Logradouro não pode ter mais de 200 caracteres"],
      },
      number: {
        type: String,
        trim: true,
        maxlength: [20, "Número não pode ter mais de 20 caracteres"],
      },
      complement: {
        type: String,
        trim: true,
        maxlength: [100, "Complemento não pode ter mais de 100 caracteres"],
      },
      neighborhood: {
        type: String,
        trim: true,
        maxlength: [100, "Bairro não pode ter mais de 100 caracteres"],
      },
      city: {
        type: String,
        trim: true,
        maxlength: [100, "Cidade não pode ter mais de 100 caracteres"],
      },
      state: {
        type: String,
        trim: true,
        maxlength: [50, "Estado não pode ter mais de 50 caracteres"],
      },
      zipCode: {
        type: String,
        trim: true,
        maxlength: [20, "CEP não pode ter mais de 20 caracteres"],
      },
      country: {
        type: String,
        trim: true,
        maxlength: [50, "País não pode ter mais de 50 caracteres"],
        default: "Brasil",
      },
    },

    // Cor/Etnia
    ethnicity: {
      type: String,
      enum: [
        "branca",
        "preta",
        "parda",
        "amarela",
        "indígena",
        "não_declarada",
        "não_identificada",
      ],
      default: "não_declarada",
    },

    // Campos adicionais de identificação
    identificationType: {
      type: String,
      enum: ["identificada", "não_identificada"],
      required: [true, "Tipo de identificação é obrigatório"],
    },
    referenceCode: {
      type: String,
      trim: true,
      sparse: true, // Permite que seja único apenas quando presente
    },
    nationality: {
      type: String,
      trim: true,
      maxlength: [50, "Nacionalidade não pode ter mais de 50 caracteres"],
    },

    // Informações sobre o corpo
    locationDate: {
      type: Date,
    },
    locationPlace: {
      type: String,
      trim: true,
      maxlength: [200, "Local de encontro não pode ter mais de 200 caracteres"],
    },
    bodyCondition: {
      type: String,
      enum: [
        "íntegro",
        "decomposição_inicial",
        "decomposição_avançada",
        "esqueletizado",
        "parcialmente_esqueletizado",
        "carbonizado",
        "mumificado",
        "fragmentado",
      ],
    },
    probableCauseOfDeath: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Causa provável da morte não pode ter mais de 500 caracteres",
      ],
    },

    // Odontograma com anotações
    odontogram: {
      // Dentes superiores direitos (18-11)
      tooth18: toothSchema,
      tooth17: toothSchema,
      tooth16: toothSchema,
      tooth15: toothSchema,
      tooth14: toothSchema,
      tooth13: toothSchema,
      tooth12: toothSchema,
      tooth11: toothSchema,

      // Dentes superiores esquerdos (21-28)
      tooth21: toothSchema,
      tooth22: toothSchema,
      tooth23: toothSchema,
      tooth24: toothSchema,
      tooth25: toothSchema,
      tooth26: toothSchema,
      tooth27: toothSchema,
      tooth28: toothSchema,

      // Dentes inferiores esquerdos (31-38)
      tooth38: toothSchema,
      tooth37: toothSchema,
      tooth36: toothSchema,
      tooth35: toothSchema,
      tooth34: toothSchema,
      tooth33: toothSchema,
      tooth32: toothSchema,
      tooth31: toothSchema,

      // Dentes inferiores direitos (41-48)
      tooth41: toothSchema,
      tooth42: toothSchema,
      tooth43: toothSchema,
      tooth44: toothSchema,
      tooth45: toothSchema,
      tooth46: toothSchema,
      tooth47: toothSchema,
      tooth48: toothSchema,

      // Informações gerais do odontograma
      generalNotes: {
        type: String,
        trim: true,
        maxlength: [
          1000,
          "Anotações gerais não podem ter mais de 1000 caracteres",
        ],
      },
      annotations: {
        type: String,
        trim: true,
        maxlength: [
          1000,
          "Anotações do odontograma não podem ter mais de 1000 caracteres",
        ],
      },
      lastUpdate: {
        type: Date,
        default: Date.now,
      },
    },

    // Anotações de regiões anatômicas
    anatomicalRegions: [anatomicalRegionSchema],

    // Características odontológicas específicas
    dentalFeatures: [
      {
        type: {
          type: String,
          enum: [
            "prótese",
            "implante",
            "ortodôntico",
            "endodôntico",
            "anomalia",
            "patologia",
            "característica_única",
            "outro",
          ],
          required: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "Descrição não pode ter mais de 500 caracteres"],
        },
        location: {
          type: String,
          trim: true,
          maxlength: [100, "Localização não pode ter mais de 100 caracteres"],
        },
        identificationValue: {
          type: String,
          enum: ["baixo", "médio", "alto"],
          default: "médio",
        },
      },
    ],

    // Documentação ante-mortem
    antemortemRecords: [
      {
        type: {
          type: String,
          enum: [
            "radiografia_panorâmica",
            "radiografia_periapical",
            "tomografia",
            "foto",
            "modelo_gesso",
            "prontuário_odontológico",
            "outro",
          ],
          required: true,
        },
        documentDate: Date,
        source: {
          type: String,
          trim: true,
          maxlength: [200, "Fonte não pode ter mais de 200 caracteres"],
        },
        fileUrl: String,
        notes: {
          type: String,
          trim: true,
          maxlength: [500, "Anotações não podem ter mais de 500 caracteres"],
        },
      },
    ],

    // Métodos de identificação aplicados
    identificationMethods: [
      {
        method: {
          type: String,
          enum: [
            "comparação_odontológica",
            "dna",
            "impressão_digital",
            "antropologia",
            "visual",
            "pertences_pessoais",
            "outro",
          ],
          required: true,
        },
        result: {
          type: String,
          enum: ["positivo", "negativo", "inconclusivo", "em_andamento"],
          required: true,
        },
        reliability: {
          type: String,
          enum: ["baixa", "média", "alta"],
          default: "média",
        },
        analysisDate: Date,
        notes: {
          type: String,
          trim: true,
          maxlength: [500, "Anotações não podem ter mais de 500 caracteres"],
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
        relationType: {
          type: String,
          enum: ["principal", "secundária", "outro"],
          default: "principal",
        },
        notes: {
          type: String,
          trim: true,
          maxlength: [300, "Anotações não podem ter mais de 300 caracteres"],
        },
      },
    ],

    // Evidências relacionadas
    evidences: [
      {
        evidenceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Evidence",
        },
        relationType: {
          type: String,
          enum: ["direta", "indireta", "contextual"],
          default: "direta",
        },
        notes: {
          type: String,
          trim: true,
          maxlength: [300, "Anotações não podem ter mais de 300 caracteres"],
        },
      },
    ],

    // Metadados
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Índices para melhorar a performance das consultas
victimSchema.index({ identificationType: 1 });
victimSchema.index({ name: 1 });
victimSchema.index({ nic: 1 }, { sparse: true });
victimSchema.index({ "document.number": 1 }, { sparse: true });
victimSchema.index({ referenceCode: 1 }, { sparse: true });
victimSchema.index({ "cases.caseId": 1 });
victimSchema.index({ gender: 1, ethnicity: 1 });
victimSchema.index({ "address.city": 1, "address.state": 1 });

// Middleware para validar campos baseados no tipo de identificação
victimSchema.pre("validate", function (next) {
  if (this.identificationType === "identificada") {
    // Vítimas identificadas devem ter nome
    if (!this.name) {
      this.invalidate("name", "Nome é obrigatório para vítimas identificadas");
    }
  } else if (this.identificationType === "não_identificada") {
    // Vítimas não identificadas devem ter código de referência
    if (!this.referenceCode) {
      this.invalidate(
        "referenceCode",
        "Código de referência é obrigatório para vítimas não identificadas"
      );
    }
  }

  // Validar idade vs data de nascimento
  if (this.age && this.birthDate) {
    const calculatedAge = Math.floor(
      (Date.now() - this.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    if (Math.abs(this.age - calculatedAge) > 1) {
      this.invalidate(
        "age",
        "Idade informada não confere com a data de nascimento"
      );
    }
  }

  next();
});

// Método para vincular vítima a um caso
victimSchema.methods.addCase = function (
  caseId,
  relationType = "principal",
  notes = ""
) {
  // Verificar se o caso já está vinculado
  const existingCase = this.cases.find(
    (c) => c.caseId.toString() === caseId.toString()
  );

  if (existingCase) {
    // Atualizar informações se já existir
    existingCase.relationType = relationType;
    existingCase.notes = notes;
  } else {
    // Adicionar novo caso
    this.cases.push({
      caseId,
      relationType,
      notes,
    });
  }

  return this;
};

// Método para vincular vítima a uma evidência
victimSchema.methods.addEvidence = function (
  evidenceId,
  relationType = "direta",
  notes = ""
) {
  // Verificar se a evidência já está vinculada
  const existingEvidence = this.evidences.find(
    (e) => e.evidenceId.toString() === evidenceId.toString()
  );

  if (existingEvidence) {
    // Atualizar informações se já existir
    existingEvidence.relationType = relationType;
    existingEvidence.notes = notes;
  } else {
    // Adicionar nova evidência
    this.evidences.push({
      evidenceId,
      relationType,
      notes,
    });
  }

  return this;
};

// Método para atualizar um dente específico no odontograma
victimSchema.methods.updateTooth = function (toothNumber, toothData) {
  if (this.odontogram[`tooth${toothNumber}`]) {
    // Atualizar campos do dente
    Object.keys(toothData).forEach((field) => {
      this.odontogram[`tooth${toothNumber}`][field] = toothData[field];
    });

    // Atualizar data da última atualização
    this.odontogram[`tooth${toothNumber}`].lastUpdate = Date.now();
    this.odontogram.lastUpdate = Date.now();
  }

  return this;
};

// Método para adicionar anotação de região anatômica
victimSchema.methods.addAnatomicalRegion = function (
  region,
  description,
  findings,
  pathologies,
  annotations,
  images,
  registeredBy
) {
  this.anatomicalRegions.push({
    region,
    description,
    findings,
    pathologies,
    annotations,
    images: images || [],
    registeredBy,
  });

  return this;
};

// Método para atualizar anotação de região anatômica
victimSchema.methods.updateAnatomicalRegion = function (regionId, updateData) {
  const region = this.anatomicalRegions.id(regionId);
  if (region) {
    Object.keys(updateData).forEach((field) => {
      region[field] = updateData[field];
    });
  }
  return this;
};

// Método para remover anotação de região anatômica
victimSchema.methods.removeAnatomicalRegion = function (regionId) {
  this.anatomicalRegions.pull(regionId);
  return this;
};

// Método para adicionar característica odontológica
victimSchema.methods.addDentalFeature = function (
  type,
  description,
  location,
  identificationValue
) {
  this.dentalFeatures.push({
    type,
    description,
    location,
    identificationValue: identificationValue || "médio",
  });

  return this;
};

// Método para adicionar documentação ante-mortem
victimSchema.methods.addAntemortemRecord = function (
  type,
  documentDate,
  source,
  fileUrl,
  notes
) {
  this.antemortemRecords.push({
    type,
    documentDate,
    source,
    fileUrl,
    notes,
  });

  return this;
};

// Método para adicionar método de identificação
victimSchema.methods.addIdentificationMethod = function (
  method,
  result,
  reliability,
  analysisDate,
  notes
) {
  this.identificationMethods.push({
    method,
    result,
    reliability: reliability || "média",
    analysisDate,
    notes,
  });

  return this;
};

const Victim = mongoose.model("Victim", victimSchema);

export default Victim;
