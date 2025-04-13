import Patient from "../models/patient.model.js"
import Case from "../models/case.model.js"
import asyncHandler from "../utils/asyncHandler.js"

/**
 * @desc    Obter todos os pacientes
 * @route   GET /api/patients
 * @access  Privado
 */
export const getPatients = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

/**
 * @desc    Obter um paciente específico
 * @route   GET /api/patients/:id
 * @access  Privado
 */
export const getPatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("cases.caseId", "title status")
    .populate("dentalFeatures.recordedBy", "name email")

  if (!patient) {
    const error = new Error(`Paciente não encontrado com id ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  res.status(200).json({
    success: true,
    data: patient,
  })
})

/**
 * @desc    Criar novo paciente
 * @route   POST /api/patients
 * @access  Privado
 */
export const createPatient = asyncHandler(async (req, res, next) => {
  // Adicionar usuário como criador
  req.body.createdBy = req.user.id

  // Validar tipo de paciente
  if (!req.body.patientType || !["identificado", "não identificado"].includes(req.body.patientType)) {
    const error = new Error("Tipo de paciente inválido. Deve ser 'Identificado' ou 'não identificado'")
    error.statusCode = 400
    return next(error)
  }

  // Validações específicas para cada tipo de paciente
  if (req.body.patientType === "identificado") {
    if (!req.body.name) {
      const error = new Error("Nome é obrigatório para pacientes identificados")
      error.statusCode = 400
      return next(error)
    }

    // Verificar CPF duplicado se fornecido
    if (req.body.cpf) {
      const existingPatient = await Patient.findOne({ cpf: req.body.cpf })
      if (existingPatient) {
        const error = new Error(`Já existe um paciente com o CPF ${req.body.cpf}`)
        error.statusCode = 400
        return next(error)
      }
    }
  } else if (req.body.patientType === "não identificado") {
    if (!req.body.referenceCode) {
      const error = new Error("Código de referência é obrigatório para pacientes não identificados")
      error.statusCode = 400
      return next(error)
    }

    // Verificar código de referência duplicado
    const existingPatient = await Patient.findOne({ referenceCode: req.body.referenceCode })
    if (existingPatient) {
      const error = new Error(`Já existe um paciente com o código de referência ${req.body.referenceCode}`)
      error.statusCode = 400
      return next(error)
    }
  }

  // Vincular a um caso, se fornecido
  if (req.body.caseId) {
    // Verificar se o caso existe
    const forensicCase = await Case.findById(req.body.caseId)
    if (!forensicCase) {
      const error = new Error(`Caso não encontrado com id ${req.body.caseId}`)
      error.statusCode = 404
      return next(error)
    }

    // Verificar se o usuário tem acesso ao caso
    if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      const error = new Error(`Usuário ${req.user.id} não está autorizado a vincular pacientes a este caso`)
      error.statusCode = 403
      return next(error)
    }

    // Preparar array de casos
    req.body.cases = [
      {
        caseId: req.body.caseId,
        relationshipType: req.body.relationshipType || "outro",
        notes: req.body.caseNotes || "",
      },
    ]

    // Remover campos temporários
    delete req.body.caseId
    delete req.body.relationshipType
    delete req.body.caseNotes
  }

  const patient = await Patient.create(req.body)

  res.status(201).json({
    success: true,
    data: patient,
  })
})

/**
 * @desc    Atualizar paciente
 * @route   PUT /api/patients/:id
 * @access  Privado
 */
export const updatePatient = asyncHandler(async (req, res, next) => {
  let patient = await Patient.findById(req.params.id)

  if (!patient) {
    const error = new Error(`Paciente não encontrado com id ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  // Não permitir alteração do tipo de paciente
  if (req.body.patientType && req.body.patientType !== patient.patientType) {
    const error = new Error("Não é permitido alterar o tipo de paciente")
    error.statusCode = 400
    return next(error)
  }

  // Não permitir alteração do criador
  delete req.body.createdBy

  // Verificar CPF duplicado se estiver sendo alterado
  if (req.body.cpf && req.body.cpf !== patient.cpf) {
    const existingPatient = await Patient.findOne({ cpf: req.body.cpf })
    if (existingPatient && existingPatient._id.toString() !== req.params.id) {
      const error = new Error(`Já existe um paciente com o CPF ${req.body.cpf}`)
      error.statusCode = 400
      return next(error)
    }
  }

  // Verificar código de referência duplicado se estiver sendo alterado
  if (req.body.referenceCode && req.body.referenceCode !== patient.referenceCode) {
    const existingPatient = await Patient.findOne({ referenceCode: req.body.referenceCode })
    if (existingPatient && existingPatient._id.toString() !== req.params.id) {
      const error = new Error(`Já existe um paciente com o código de referência ${req.body.referenceCode}`)
      error.statusCode = 400
      return next(error)
    }
  }

  patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: patient,
  })
})

/**
 * @desc    Excluir paciente
 * @route   DELETE /api/patients/:id
 * @access  Privado
 */
export const deletePatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id)

  if (!patient) {
    const error = new Error(`Paciente não encontrado com id ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  await patient.remove()

  res.status(200).json({
    success: true,
    data: {},
  })
})

/**
 * @desc    Vincular paciente a um caso
 * @route   POST /api/patients/:id/cases
 * @access  Privado
 */
export const addCaseToPatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id)

  if (!patient) {
    const error = new Error(`Paciente não encontrado com id ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar se o caso existe
  const forensicCase = await Case.findById(req.body.caseId)
  if (!forensicCase) {
    const error = new Error(`Caso não encontrado com id ${req.body.caseId}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar se o usuário tem acesso ao caso
  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error(`Usuário ${req.user.id} não está autorizado a vincular pacientes a este caso`)
    error.statusCode = 403
    return next(error)
  }

  // Adicionar caso ao paciente
  patient.addCase(req.body.caseId, req.body.relationshipType || "outro", req.body.notes || "")

  await patient.save()

  res.status(200).json({
    success: true,
    data: patient,
  })
})

/**
 * @desc    Remover vínculo de paciente com um caso
 * @route   DELETE /api/patients/:id/cases/:caseId
 * @access  Privado
 */
export const removeCaseFromPatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id)

  if (!patient) {
    const error = new Error(`Paciente não encontrado com id ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar se o caso existe
  const forensicCase = await Case.findById(req.params.caseId)
  if (!forensicCase) {
    const error = new Error(`Caso não encontrado com id ${req.params.caseId}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar se o usuário tem acesso ao caso
  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error(`Usuário ${req.user.id} não está autorizado a desvincular pacientes deste caso`)
    error.statusCode = 403
    return next(error)
  }

  // Verificar se o caso está vinculado ao paciente
  const caseIndex = patient.cases.findIndex((c) => c.caseId.toString() === req.params.caseId)

  if (caseIndex === -1) {
    const error = new Error(`Caso ${req.params.caseId} não está vinculado ao paciente ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  // Remover caso do paciente
  patient.cases.splice(caseIndex, 1)

  await patient.save()

  res.status(200).json({
    success: true,
    data: patient,
  })
})

/**
 * @desc    Adicionar característica odontológica
 * @route   POST /api/patients/:id/dental-features
 * @access  Privado
 */
export const addDentalFeature = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id)

  if (!patient) {
    const error = new Error(`Paciente não encontrado com id ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  // Validar dados da característica
  if (!req.body.toothNumber || !req.body.description || !req.body.type) {
    const error = new Error(`Dados incompletos. Forneça toothNumber, description e type`)
    error.statusCode = 400
    return next(error)
  }

  // Adicionar característica
  patient.addDentalFeature(req.body.toothNumber, req.body.description, req.body.type, req.body.notes || "", req.user.id)

  await patient.save()

  res.status(200).json({
    success: true,
    data: patient,
  })
})

/**
 * @desc    Buscar pacientes por características odontológicas
 * @route   POST /api/patients/search/dental
 * @access  Privado
 */
export const searchByDentalFeatures = asyncHandler(async (req, res, next) => {
  const { features, matchAll = false, page = 1, limit = 25 } = req.body

  if (!features || !Array.isArray(features) || features.length === 0) {
    const error = new Error(`Forneça um array de características odontológicas para busca`)
    error.statusCode = 400
    return next(error)
  }

  // Construir query de busca
  let query

  if (matchAll) {
    // Deve corresponder a todas as características (AND)
    query = {
      $and: features.map((feature) => ({
        dentalFeatures: {
          $elemMatch: {
            toothNumber: feature.toothNumber,
            type: feature.type,
          },
        },
      })),
    }
  } else {
    // Deve corresponder a pelo menos uma característica (OR)
    query = {
      dentalFeatures: {
        $elemMatch: {
          $or: features.map((feature) => ({
            toothNumber: feature.toothNumber,
            type: feature.type,
          })),
        },
      },
    }
  }

  // Calcular skip para paginação
  const skip = (page - 1) * limit

  // Executar consulta
  const patients = await Patient.find(query)
    .skip(skip)
    .limit(limit)
    .select("patientType name referenceCode gender estimatedGender status dentalFeatures")
    .sort("patientType name referenceCode")

  // Contar total de resultados para paginação
  const total = await Patient.countDocuments(query)

  // Calcular informações de paginação
  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    limit,
  }

  if (skip + patients.length < total) {
    pagination.next = {
      page: page + 1,
      limit,
    }
  }

  if (skip > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    }
  }

  // Calcular pontuação de correspondência para cada paciente
  const patientsWithScore = patients.map((patient) => {
    let score = 0
    const patientFeatures = patient.dentalFeatures || []

    features.forEach((searchFeature) => {
      patientFeatures.forEach((patientFeature) => {
        if (patientFeature.toothNumber === searchFeature.toothNumber && patientFeature.type === searchFeature.type) {
          score += 1
        }
      })
    })

    const maxScore = features.length
    const matchPercentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

    return {
      ...patient.toObject(),
      matchScore: score,
      matchPercentage,
    }
  })

  // Ordenar por pontuação (maior para menor)
  patientsWithScore.sort((a, b) => b.matchScore - a.matchScore)

  res.status(200).json({
    success: true,
    count: patients.length,
    pagination,
    data: patientsWithScore,
  })
})

/**
 * @desc    Obter pacientes vinculados a um caso
 * @route   GET /api/cases/:caseId/patients
 * @access  Privado
 */
export const getCasePatients = asyncHandler(async (req, res, next) => {
  const forensicCase = await Case.findById(req.params.caseId)

  if (!forensicCase) {
    const error = new Error(`Caso não encontrado com id ${req.params.caseId}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar se o usuário tem acesso ao caso
  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error(`Usuário ${req.user.id} não está autorizado a acessar pacientes deste caso`)
    error.statusCode = 403
    return next(error)
  }

  const patients = await Patient.find({ "cases.caseId": req.params.caseId })
    .select("patientType name referenceCode gender estimatedGender status cases")
    .sort("patientType name referenceCode")

  res.status(200).json({
    success: true,
    count: patients.length,
    data: patients,
  })
})
