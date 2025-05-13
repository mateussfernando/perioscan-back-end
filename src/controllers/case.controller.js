import Case from "../models/case.model.js";
import ErrorResponse from "../utils/errorResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// @desc    Obter todos os casos
// @route   GET /api/cases
// @access  Privado
export const getCases = asyncHandler(async (req, res, next) => {
  // Remover a restrição de próprios casos
  // Não filtrar mais por createdBy para usuários não-admin

  // Processar filtros adicionais específicos para casos

  // Filtro por período de tempo (últimos X dias)
  if (req.query.period) {
    const days = Number.parseInt(req.query.period);
    if (!isNaN(days)) {
      const date = new Date();
      date.setDate(date.getDate() - days);
      req.query.from = date.toISOString();
    }
  }

  // Filtro por casos recentes (criados nos últimos X dias)
  if (req.query.recent) {
    const days = Number.parseInt(req.query.recent);
    if (!isNaN(days)) {
      const date = new Date();
      date.setDate(date.getDate() - days);
      req.query.createdFrom = date.toISOString();
    }
  }

  // Filtro por casos atualizados recentemente
  if (req.query.recentlyUpdated) {
    const days = Number.parseInt(req.query.recentlyUpdated);
    if (!isNaN(days)) {
      const date = new Date();
      date.setDate(date.getDate() - days);
      req.query.updatedFrom = date.toISOString();
    }
  }

  // Filtro por prioridade (se implementado no modelo)
  if (req.query.priority) {
    req.query.priority = req.query.priority;
  }

  res.status(200).json(res.advancedResults);
});

// @desc    Obter um caso específico
// @route   GET /api/cases/:id
// @access  Privado
export const getCase = asyncHandler(async (req, res, next) => {
  const forensicCase = await Case.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("evidence")
    .populate("reports");

  if (!forensicCase) {
    return next(
      new ErrorResponse(`Case not found with id of ${req.params.id}`, 404)
    );
  }

  // Remover a verificação de propriedade do caso
  // Todos os usuários podem acessar qualquer caso

  res.status(200).json({
    success: true,
    data: forensicCase,
  });
});

// @desc    Criar novo caso
// @route   POST /api/cases
// @access  Privado
export const createCase = asyncHandler(async (req, res, next) => {
  // Adicionar usuário ao req.body
  req.body.createdBy = req.user.id;

  // Converter a data do ocorrido para objeto Date se fornecida
  if (req.body.occurrenceDate) {
    req.body.occurrenceDate = new Date(req.body.occurrenceDate);
  }

  const forensicCase = await Case.create(req.body);

  res.status(201).json({
    success: true,
    data: forensicCase,
  });
});

// @desc    Atualizar caso
// @route   PUT /api/cases/:id
// @access  Privado
export const updateCase = asyncHandler(async (req, res, next) => {
  let forensicCase = await Case.findById(req.params.id);

  if (!forensicCase) {
    return next(
      new ErrorResponse(`Case not found with id of ${req.params.id}`, 404)
    );
  }

  // Remover a verificação de propriedade do caso
  // Todos os usuários autorizados podem atualizar qualquer caso

  // Converter a data do ocorrido para objeto Date se fornecida
  if (req.body.occurrenceDate) {
    req.body.occurrenceDate = new Date(req.body.occurrenceDate);
  }

  // Se o status estiver sendo alterado para 'finalizado', definir dataFechamento
  if (
    req.body.status === "finalizado" &&
    forensicCase.status !== "finalizado"
  ) {
    req.body.closeDate = Date.now();
  }

  forensicCase = await Case.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: forensicCase,
  });
});

// @desc    Excluir caso
// @route   DELETE /api/cases/:id
// @access  Privado
export const deleteCase = asyncHandler(async (req, res, next) => {
  const forensicCase = await Case.findById(req.params.id);

  if (!forensicCase) {
    return next(
      new ErrorResponse(`Case not found with id of ${req.params.id}`, 404)
    );
  }

  // Remover a verificação de propriedade do caso
  // Todos os usuários autorizados podem excluir qualquer caso

  await Case.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    data: {},
  });
});

export const searchCases = asyncHandler(async (req, res, next) => {
  const {
    keywords,
    dateRange,
    status,
    createdBy,
    location,
    sortBy,
    sortOrder,
    page = 1,
    limit = 25,
  } = req.body;

  // Construir query
  const query = {};

  // Filtro por palavras-chave (título e descrição)
  if (keywords && keywords.trim() !== "") {
    const keywordRegex = new RegExp(keywords, "i");
    query.$or = [
      { title: keywordRegex },
      { description: keywordRegex },
      { location: keywordRegex },
    ];
  }

  // Filtro por intervalo de datas
  if (dateRange) {
    query.openDate = {};

    if (dateRange.from) {
      query.openDate.$gte = new Date(dateRange.from);
    }

    if (dateRange.to) {
      query.openDate.$lte = new Date(dateRange.to);
    }
  }

  // Filtro por status
  if (status && status.length > 0) {
    query.status = { $in: status };
  }

  // Filtro por criador
  if (createdBy && createdBy.length > 0) {
    query.createdBy = { $in: createdBy };
  }

  // Filtro por localização
  if (location && location.trim() !== "") {
    query.location = new RegExp(location, "i");
  }

  // Remover a restrição para usuários não-admin
  // Não filtrar mais por createdBy para usuários não-admin

  // Calcular skip para paginação
  const skip = (page - 1) * limit;

  // Definir ordenação
  const sort = {};
  sort[sortBy || "createdAt"] = sortOrder === "asc" ? 1 : -1;

  // Executar consulta
  const cases = await Case.find(query)
    .populate("createdBy", "name email")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  // Contar total de resultados para paginação
  const total = await Case.countDocuments(query);

  // Calcular informações de paginação
  const pagination = {
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    limit,
  };

  if (skip + cases.length < total) {
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
    count: cases.length,
    pagination,
    data: cases,
  });
});

export const getCaseStats = asyncHandler(async (req, res, next) => {
  // Filtro para usuários não-admin
  const userFilter =
    req.user.role !== "admin"
      ? {
          createdBy: mongoose.Types.ObjectId(req.user.id),
        }
      : {};

  // Agregação para estatísticas
  const stats = await Case.aggregate([
    { $match: userFilter },
    {
      $facet: {
        // Contagem por status
        statusStats: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        // Contagem por mês de abertura
        monthlyStats: [
          {
            $group: {
              _id: {
                year: { $year: "$openDate" },
                month: { $month: "$openDate" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": -1, "_id.month": -1 } },
        ],
        // Contagem por localização
        locationStats: [
          { $group: { _id: "$location", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        // Total de casos
        totalCases: [{ $count: "total" }],
        // Casos recentes (últimos 30 dias)
        recentCases: [
          {
            $match: {
              openDate: {
                $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
              },
            },
          },
          { $count: "recent" },
        ],
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: stats[0],
  });
});
