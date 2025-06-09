import Victim from "../models/victim.model.js";
import Case from "../models/case.model.js";
import { Evidence } from "../models/evidence.model.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * @desc    Obter todas as vítimas
 * @route   GET /api/victims
 * @access  Privado
 */
export const getVictims = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Obter uma vítima específica
 * @route   GET /api/victims/:id
 * @access  Privado
 */
export const getVictim = asyncHandler(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("cases.caseId", "title status")
    .populate("evidences.evidenceId", "title type");

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({
    success: true,
    data: victim,
  });
});

/**
 * @desc    Criar nova vítima
 * @route   POST /api/victims
 * @access  Privado
 */
export const createVictim = asyncHandler(async (req, res, next) => {
  // Adicionar usuário como criador
  req.body.createdBy = req.user.id;
  req.body.updatedBy = req.user.id;

  // Validar tipo de identificação
  if (
    !req.body.identificationType ||
    !["identificada", "não_identificada"].includes(req.body.identificationType)
  ) {
    const error = new Error(
      "Tipo de identificação inválido. Deve ser 'identificada' ou 'não_identificada'"
    );
    error.statusCode = 400;
    return next(error);
  }

  // Validações específicas para cada tipo de vítima
  if (req.body.identificationType === "identificada") {
    if (!req.body.name) {
      const error = new Error("Nome é obrigatório para vítimas identificadas");
      error.statusCode = 400;
      return next(error);
    }

    // Verificar NIC duplicado se fornecido
    if (req.body.nic) {
      const existingVictim = await Victim.findOne({
        nic: req.body.nic,
      });
      if (existingVictim) {
        const error = new Error(
          `Já existe uma vítima com o NIC ${req.body.nic}`
        );
        error.statusCode = 400;
        return next(error);
      }
    }

    // Verificar documento duplicado se fornecido
    if (req.body.document && req.body.document.number) {
      const existingVictim = await Victim.findOne({
        "document.number": req.body.document.number,
      });
      if (existingVictim) {
        const error = new Error(
          `Já existe uma vítima com o documento ${req.body.document.number}`
        );
        error.statusCode = 400;
        return next(error);
      }
    }
  } else if (req.body.identificationType === "não_identificada") {
    if (!req.body.referenceCode) {
      const error = new Error(
        "Código de referência é obrigatório para vítimas não identificadas"
      );
      error.statusCode = 400;
      return next(error);
    }

    // Verificar código de referência duplicado
    const existingVictim = await Victim.findOne({
      referenceCode: req.body.referenceCode,
    });
    if (existingVictim) {
      const error = new Error(
        `Já existe uma vítima com o código de referência ${req.body.referenceCode}`
      );
      error.statusCode = 400;
      return next(error);
    }
  }

  // Vincular a um caso, se fornecido
  if (req.body.caseId) {
    // Verificar se o caso existe
    const forensicCase = await Case.findById(req.body.caseId);
    if (!forensicCase) {
      const error = new Error(`Caso não encontrado com id ${req.body.caseId}`);
      error.statusCode = 404;
      return next(error);
    }

    // Preparar array de casos
    req.body.cases = [
      {
        caseId: req.body.caseId,
        relationType: req.body.relationType || "principal",
        notes: req.body.caseNotes || "",
      },
    ];

    // Remover campos temporários
    delete req.body.caseId;
    delete req.body.relationType;
    delete req.body.caseNotes;
  }

  const victim = await Victim.create(req.body);

  res.status(201).json({
    success: true,
    data: victim,
  });
});

/**
 * @desc    Atualizar vítima
 * @route   PUT /api/victims/:id
 * @access  Privado
 */
export const updateVictim = asyncHandler(async (req, res, next) => {
  let victim = await Victim.findById(req.params.id);

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  // Não permitir alteração do tipo de identificação
  if (
    req.body.identificationType &&
    req.body.identificationType !== victim.identificationType
  ) {
    const error = new Error("Não é permitido alterar o tipo de identificação");
    error.statusCode = 400;
    return next(error);
  }

  // Atualizar o usuário que fez a última modificação
  req.body.updatedBy = req.user.id;

  // Não permitir alteração do criador
  delete req.body.createdBy;

  // Verificar NIC duplicado se estiver sendo alterado
  if (req.body.nic && req.body.nic !== victim.nic) {
    const existingVictim = await Victim.findOne({
      nic: req.body.nic,
    });
    if (existingVictim && existingVictim._id.toString() !== req.params.id) {
      const error = new Error(
        `Já existe uma vítima com o NIC ${req.body.nic}`
      );
      error.statusCode = 400;
      return next(error);
    }
  }

  // Verificar documento duplicado se estiver sendo alterado
  if (req.body.document && req.body.document.number && 
      req.body.document.number !== victim.document?.number) {
    const existingVictim = await Victim.findOne({
      "document.number": req.body.document.number,
    });
    if (existingVictim && existingVictim._id.toString() !== req.params.id) {
      const error = new Error(
        `Já existe uma vítima com o documento ${req.body.document.number}`
      );
      error.statusCode = 400;
      return next(error);
    }
    
  }

  // Verificar código de referência duplicado se estiver sendo alterado
  if (
    req.body.referenceCode &&
    req.body.referenceCode !== victim.referenceCode
  ) {
    const existingVictim = await Victim.findOne({
      referenceCode: req.body.referenceCode,
    });
    if (existingVictim && existingVictim._id.toString() !== req.params.id) {
      const error = new Error(
        `Já existe uma vítima com o código de referência ${req.body.referenceCode}`
      );
      error.statusCode = 400;
      return next(error);
    }
  }

  victim = await Victim.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: victim,
  });
});

/**
 * @desc    Excluir vítima
 * @route   DELETE /api/victims/:id
 * @access  Privado
 */
export const deleteVictim = asyncHandler(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id);

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  await victim.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @desc    Vincular vítima a um caso
 * @route   POST /api/victims/:id/cases
 * @access  Privado
 */
export const addCaseToVictim = asyncHandler(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id);

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  // Verificar se o caso existe
  const forensicCase = await Case.findById(req.body.caseId);
  if (!forensicCase) {
    const error = new Error(`Caso não encontrado com id ${req.body.caseId}`);
    error.statusCode = 404;
    return next(error);
  }

  // Adicionar caso à vítima
  victim.addCase(
    req.body.caseId,
    req.body.relationType || "principal",
    req.body.notes || ""
  );
  victim.updatedBy = req.user.id;

  await victim.save();

  res.status(200).json({
    success: true,
    data: victim,
  });
});

/**
 * @desc    Remover vínculo de vítima com um caso
 * @route   DELETE /api/victims/:id/cases/:caseId
 * @access  Privado
 */
export const removeCaseFromVictim = asyncHandler(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id);

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  // Verificar se o caso existe
  const forensicCase = await Case.findById(req.params.caseId);
  if (!forensicCase) {
    const error = new Error(`Caso não encontrado com id ${req.params.caseId}`);
    error.statusCode = 404;
    return next(error);
  }

  // Verificar se o caso está vinculado à vítima
  const caseIndex = victim.cases.findIndex(
    (c) => c.caseId.toString() === req.params.caseId
  );

  if (caseIndex === -1) {
    const error = new Error(
      `Caso ${req.params.caseId} não está vinculado à vítima ${req.params.id}`
    );
    error.statusCode = 404;
    return next(error);
  }

  // Remover caso da vítima
  victim.cases.splice(caseIndex, 1);
  victim.updatedBy = req.user.id;

  await victim.save();

  res.status(200).json({
    success: true,
    data: victim,
  });
});

/**
 * @desc    Vincular vítima a uma evidência
 * @route   POST /api/victims/:id/evidences
 * @access  Privado
 */
export const addEvidenceToVictim = asyncHandler(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id);

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  // Verificar se a evidência existe
  const evidence = await Evidence.findById(req.body.evidenceId);
  if (!evidence) {
    const error = new Error(
      `Evidência não encontrada com id ${req.body.evidenceId}`
    );
    error.statusCode = 404;
    return next(error);
  }

  // Adicionar evidência à vítima
  victim.addEvidence(
    req.body.evidenceId,
    req.body.relationType || "direta",
    req.body.notes || ""
  );
  victim.updatedBy = req.user.id;

  await victim.save();

  res.status(200).json({
    success: true,
    data: victim,
  });
});

/**
 * @desc    Remover vínculo de vítima com uma evidência
 * @route   DELETE /api/victims/:id/evidences/:evidenceId
 * @access  Privado
 */
export const removeEvidenceFromVictim = asyncHandler(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id);

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  // Verificar se a evidência existe
  const evidence = await Evidence.findById(req.params.evidenceId);
  if (!evidence) {
    const error = new Error(
      `Evidência não encontrada com id ${req.params.evidenceId}`
    );
    error.statusCode = 404;
    return next(error);
  }

  // Verificar se a evidência está vinculada à vítima
  const evidenceIndex = victim.evidences.findIndex(
    (e) => e.evidenceId.toString() === req.params.evidenceId
  );

  if (evidenceIndex === -1) {
    const error = new Error(
      `Evidência ${req.params.evidenceId} não está vinculada à vítima ${req.params.id}`
    );
    error.statusCode = 404;
    return next(error);
  }

  // Remover evidência da vítima
  victim.evidences.splice(evidenceIndex, 1);
  victim.updatedBy = req.user.id;

  await victim.save();

  res.status(200).json({
    success: true,
    data: victim,
  });
});

/**
 * @desc    Atualizar dente no odontograma
 * @route   PUT /api/victims/:id/odontogram/:toothNumber
 * @access  Privado
 */
export const updateTooth = asyncHandler(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id);

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  const toothNumber = req.params.toothNumber;

  // Verificar se o número do dente é válido (11-48)
  if (!toothNumber.match(/^[1-4][1-8]$/)) {
    const error = new Error(
      `Número de dente inválido: ${toothNumber}. Deve estar no formato FDI (11-48)`
    );
    error.statusCode = 400;
    return next(error);
  }

  // Verificar se o dente existe no odontograma
  const toothProp = `odontogram.tooth${toothNumber}`;
  if (!victim.odontogram[`tooth${toothNumber}`]) {
    // Se o dente não existir, inicializar com valores padrão
    victim.odontogram[`tooth${toothNumber}`] = {
      number: toothNumber,
      status: "não_avaliado",
      restorations: [],
      rootCanal: false,
      crown: "não",
      registeredBy: req.user.id,
      registeredAt: Date.now(),
      lastUpdate: Date.now(),
    };
  }

  // Atualizar os dados do dente
  Object.keys(req.body).forEach((field) => {
    victim.odontogram[`tooth${toothNumber}`][field] = req.body[field];
  });

  // Atualizar metadados
  victim.odontogram[`tooth${toothNumber}`].lastUpdate = Date.now();
  victim.odontogram.lastUpdate = Date.now();
  victim.updatedBy = req.user.id;

  await victim.save();

  res.status(200).json({
    success: true,
    data: victim.odontogram[`tooth${toothNumber}`],
  });
});

/**
 * @desc    Adicionar característica odontológica
 * @route   POST /api/victims/:id/dental-features
 * @access  Privado
 */
export const addDentalFeature = asyncHandler(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id);

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  // Validar dados da característica
  if (!req.body.type || !req.body.description) {
    const error = new Error(`Dados incompletos. Forneça type e description`);
    error.statusCode = 400;
    return next(error);
  }

  // Adicionar característica
  victim.addDentalFeature(
    req.body.type,
    req.body.description,
    req.body.location || "",
    req.body.identificationValue || "médio"
  );

  victim.updatedBy = req.user.id;

  await victim.save();

  res.status(200).json({
    success: true,
    data: victim.dentalFeatures[victim.dentalFeatures.length - 1],
  });
});

/**
 * @desc    Adicionar anotação de região anatômica
 * @route   POST /api/victims/:id/anatomical-regions
 * @access  Privado
 */
export const addAnatomicalRegion = asyncHandler(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id);

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  // Validar dados obrigatórios
  if (!req.body.region || !req.body.description) {
    const error = new Error(`Dados incompletos. Forneça region e description`);
    error.statusCode = 400;
    return next(error);
  }

  // Adicionar região anatômica
  victim.addAnatomicalRegion(
    req.body.region,
    req.body.description,
    req.body.findings || "",
    req.body.pathologies || "",
    req.body.annotations || "",
    req.body.images || [],
    req.user.id
  );

  victim.updatedBy = req.user.id;

  await victim.save();

  res.status(201).json({
    success: true,
    data: victim.anatomicalRegions[victim.anatomicalRegions.length - 1],
  });
});

/**
 * @desc    Atualizar anotação de região anatômica
 * @route   PUT /api/victims/:id/anatomical-regions/:regionId
 * @access  Privado
 */
export const updateAnatomicalRegion = asyncHandler(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id);

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  // Verificar se a região existe
  const region = victim.anatomicalRegions.id(req.params.regionId);
  if (!region) {
    const error = new Error(`Região anatômica não encontrada com id ${req.params.regionId}`);
    error.statusCode = 404;
    return next(error);
  }

  // Atualizar região anatômica
  victim.updateAnatomicalRegion(req.params.regionId, req.body);
  victim.updatedBy = req.user.id;

  await victim.save();

  res.status(200).json({
    success: true,
    data: victim.anatomicalRegions.id(req.params.regionId),
  });
});

/**
 * @desc    Remover anotação de região anatômica
 * @route   DELETE /api/victims/:id/anatomical-regions/:regionId
 * @access  Privado
 */
export const removeAnatomicalRegion = asyncHandler(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id);

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  // Verificar se a região existe
  const region = victim.anatomicalRegions.id(req.params.regionId);
  if (!region) {
    const error = new Error(`Região anatômica não encontrada com id ${req.params.regionId}`);
    error.statusCode = 404;
    return next(error);
  }

  // Remover região anatômica
  victim.removeAnatomicalRegion(req.params.regionId);
  victim.updatedBy = req.user.id;

  await victim.save();

  res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @desc    Obter anotações de regiões anatômicas de uma vítima
 * @route   GET /api/victims/:id/anatomical-regions
 * @access  Privado
 */
export const getAnatomicalRegions = asyncHandler(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id)
    .select('anatomicalRegions')
    .populate('anatomicalRegions.registeredBy', 'name email');

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({
    success: true,
    count: victim.anatomicalRegions.length,
    data: victim.anatomicalRegions,
  });
});

/**
 * @desc    Atualizar anotações do odontograma
 * @route   PUT /api/victims/:id/odontogram/annotations
 * @access  Privado
 */
export const updateOdontogramAnnotations = asyncHandler(async (req, res, next) => {
  const victim = await Victim.findById(req.params.id);

  if (!victim) {
    const error = new Error(`Vítima não encontrada com id ${req.params.id}`);
    error.statusCode = 404;
    return next(error);
  }

  // Atualizar anotações do odontograma
  if (req.body.generalNotes !== undefined) {
    victim.odontogram.generalNotes = req.body.generalNotes;
  }
  
  if (req.body.annotations !== undefined) {
    victim.odontogram.annotations = req.body.annotations;
  }

  victim.odontogram.lastUpdate = Date.now();
  victim.updatedBy = req.user.id;

  await victim.save();

  res.status(200).json({
    success: true,
    data: {
      generalNotes: victim.odontogram.generalNotes,
      annotations: victim.odontogram.annotations,
      lastUpdate: victim.odontogram.lastUpdate,
    },
  });
});

/**
 * @desc    Obter vítimas vinculadas a um caso
 * @route   GET /api/cases/:caseId/victims
 * @access  Privado
 */
export const getCaseVictims = asyncHandler(async (req, res, next) => {
  const forensicCase = await Case.findById(req.params.caseId);

  if (!forensicCase) {
    const error = new Error(`Caso não encontrado com id ${req.params.caseId}`);
    error.statusCode = 404;
    return next(error);
  }

  const victims = await Victim.find({ "cases.caseId": req.params.caseId })
    .sort("identificationType name referenceCode");

  res.status(200).json({
    success: true,
    count: victims.length,
    data: victims,
  });
});

/**
 * @desc    Buscar vítimas por características odontológicas
 * @route   POST /api/victims/search/odontogram
 * @access  Privado
 */
export const searchByOdontogram = asyncHandler(async (req, res, next) => {
  const { features, matchAll = false, page = 1, limit = 25 } = req.body;

  if (!features || !Array.isArray(features) || features.length === 0) {
    const error = new Error(
      `Forneça um array de características odontológicas para busca`
    );
    error.statusCode = 400;
    return next(error);
  }

  // Construir query de busca
  const query = {};

  // Para cada característica, construir uma parte da query
  const featuresQueries = features.map((feature) => {
    const { toothNumber, status, rootCanal, crown } = feature;

    const toothQuery = {};

    if (toothNumber) {
      const toothProp = `odontogram.tooth${toothNumber}`;

      if (status) {
        toothQuery[`${toothProp}.status`] = status;
      }

      if (rootCanal !== undefined) {
        toothQuery[`${toothProp}.rootCanal`] = rootCanal;
      }

      if (crown) {
        toothQuery[`${toothProp}.crown`] = crown;
      }
    }

    return toothQuery;
  });

  // Combinar as queries com AND ou OR
  if (matchAll) {
    // Deve corresponder a todas as características (AND)
    query.$and = featuresQueries;
  } else {
    // Deve corresponder a pelo menos uma característica (OR)
    query.$or = featuresQueries;
  }

  // Calcular skip para paginação
  const skip = (page - 1) * limit;

  // Executar consulta
  const victims = await Victim.find(query)
    .skip(skip)
    .limit(limit)
    .select(
      "identificationType name referenceCode gender estimatedGender status"
    )
    .sort("identificationType name referenceCode");

  // Contar total de resultados para paginação
  const total = await Victim.countDocuments(query);

  // Calcular informações de paginação
  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    limit,
  };

  if (skip + victims.length < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (skip > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: victims.length,
    pagination,
    data: victims,
  });
});
