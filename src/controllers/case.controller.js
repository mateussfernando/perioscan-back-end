import Case from "../models/case.model.js"
import ErrorResponse from "../utils/errorResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import mongoose from "mongoose";

// @desc    Obter todos os casos
// @route   GET /api/cases
// @access  Privado
export const getCases = asyncHandler(async (req, res, next) => {
  // Para usuários não-admin, mostrar apenas casos atribuídos a eles
  // ou casos que eles criaram
  if (req.user.role !== "admin") {
    if (!req.query.assignedTo && !req.query.createdBy) {
      req.query.assignedTo = req.user.id;
    } else {
      // Verificar se o usuário está tentando acessar casos que não são dele
      if (req.query.assignedTo && req.query.assignedTo !== req.user.id) {
        // Se o usuário não for admin e tentar ver casos de outros,
        // forçar a visualização apenas dos seus casos
        if (!req.query.assignedTo.includes(req.user.id)) {
          req.query.assignedTo = req.user.id;
        }
      }
    }
  }

  // Processar filtros adicionais específicos para casos
  
  // Filtro por período de tempo (últimos X dias)
  if (req.query.period) {
    const days = parseInt(req.query.period);
    if (!isNaN(days)) {
      const date = new Date();
      date.setDate(date.getDate() - days);
      req.query.from = date.toISOString();
    }
  }

  // Filtro por casos recentes (criados nos últimos X dias)
  if (req.query.recent) {
    const days = parseInt(req.query.recent);
    if (!isNaN(days)) {
      const date = new Date();
      date.setDate(date.getDate() - days);
      req.query.createdFrom = date.toISOString();
    }
  }

  // Filtro por casos atualizados recentemente
  if (req.query.recentlyUpdated) {
    const days = parseInt(req.query.recentlyUpdated);
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
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .populate("evidence")
    .populate("reports")

  if (!forensicCase) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404))
  }

  // Verificar se o usuário é o responsável pelo caso ou tem cargo de admin
  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this case`, 403))
  }

  res.status(200).json({
    success: true,
    data: forensicCase,
  })
})

// @desc    Criar novo caso
// @route   POST /api/cases
// @access  Privado
export const createCase = asyncHandler(async (req, res, next) => {
  // Adicionar usuário ao req.body
  req.body.createdBy = req.user.id

  // Se o usuário não for admin, só pode atribuir casos a si mesmo
  if (req.user.role !== "admin" && req.body.assignedTo !== req.user.id) {
    req.body.assignedTo = req.user.id
  }

  const forensicCase = await Case.create(req.body)

  res.status(201).json({
    success: true,
    data: forensicCase,
  })
})

// @desc    Atualizar caso
// @route   PUT /api/cases/:id
// @access  Privado
export const updateCase = asyncHandler(async (req, res, next) => {
  let forensicCase = await Case.findById(req.params.id)

  if (!forensicCase) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404))
  }

  // Verificar se o usuário é o responsável pelo caso ou tem cargo de admin
  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this case`, 403))
  }

  // Se o usuário não for admin, não pode reatribuir o caso a outra pessoa
  if (req.user.role !== "admin" && req.body.assignedTo && req.body.assignedTo !== req.user.id) {
    delete req.body.assignedTo
  }

  // Se o status estiver sendo alterado para 'finalizado', definir dataFechamento
  if (req.body.status === "finalizado" && forensicCase.status !== "finalizado") {
    req.body.closeDate = Date.now()
  }

  forensicCase = await Case.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: forensicCase,
  })
})

// @desc    Excluir caso
// @route   DELETE /api/cases/:id
// @access  Privado
export const deleteCase = asyncHandler(async (req, res, next) => {
  const forensicCase = await Case.findById(req.params.id)

  if (!forensicCase) {
    return next(new ErrorResponse(`Case not found with id of ${req.params.id}`, 404))
  }

  // Verificar se o usuário é o responsável pelo caso ou tem cargo de admin
  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this case`, 403))
  }

  await forensicCase.remove()

  res.status(200).json({
    success: true,
    data: {},
  })
})

export const searchCases = asyncHandler(async (req, res, next) => {
  const {
    keywords,
    dateRange,
    status,
    assignedTo,
    createdBy,
    sortBy,
    sortOrder,
    page = 1,
    limit = 25
  } = req.body;

  // Construir query
  const query = {};

  // Filtro por palavras-chave (título e descrição)
  if (keywords && keywords.trim() !== '') {
    const keywordRegex = new RegExp(keywords, 'i');
    query.$or = [
      { title: keywordRegex },
      { description: keywordRegex }
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

  // Filtro por responsável
  if (assignedTo && assignedTo.length > 0) {
    query.assignedTo = { $in: assignedTo };
  }

  // Filtro por criador
  if (createdBy && createdBy.length > 0) {
    query.createdBy = { $in: createdBy };
  }

  // Para usuários não-admin, restringir aos seus casos
  if (req.user.role !== "admin") {
    if (!query.$or) {
      query.$or = [];
    }
    
    query.$or.push(
      { assignedTo: req.user.id },
      { createdBy: req.user.id }
    );
  }

  // Calcular skip para paginação
  const skip = (page - 1) * limit;

  // Definir ordenação
  const sort = {};
  sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;

  // Executar consulta
  const cases = await Case.find(query)
    .populate("assignedTo", "name email")
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
    limit
  };

  if (skip + cases.length < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (skip > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: cases.length,
    pagination,
    data: cases
  });
});

export const getCaseStats = asyncHandler(async (req, res, next) => {
  // Filtro para usuários não-admin
  const userFilter = req.user.role !== "admin" 
    ? { $or: [{ assignedTo: mongoose.Types.ObjectId(req.user.id) }, { createdBy: mongoose.Types.ObjectId(req.user.id) }] }
    : {};

  // Agregação para estatísticas
  const stats = await Case.aggregate([
    { $match: userFilter },
    {
      $facet: {
        // Contagem por status
        statusStats: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        // Contagem por mês de abertura
        monthlyStats: [
          {
            $group: {
              _id: { 
                year: { $year: "$openDate" }, 
                month: { $month: "$openDate" } 
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { "_id.year": -1, "_id.month": -1 } }
        ],
        // Contagem por perito responsável
        peritoStats: [
          { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        // Total de casos
        totalCases: [
          { $count: "total" }
        ],
        // Casos recentes (últimos 30 dias)
        recentCases: [
          { 
            $match: { 
              openDate: { 
                $gte: new Date(new Date().setDate(new Date().getDate() - 30)) 
              } 
            } 
          },
          { $count: "recent" }
        ]
      }
    }
  ]);

  // Preencher dados dos peritos
  if (stats[0].peritoStats.length > 0) {
    const peritoIds = stats[0].peritoStats.map(item => item._id);
    const peritos = await mongoose.model('User').find(
      { _id: { $in: peritoIds } },
      { name: 1, email: 1 }
    );

    // Mapear IDs para nomes
    const peritoMap = {};
    peritos.forEach(perito => {
      peritoMap[perito._id] = perito.name;
    });

    // Adicionar nomes aos resultados
    stats[0].peritoStats = stats[0].peritoStats.map(item => ({
      _id: item._id,
      name: peritoMap[item._id] || 'Desconhecido',
      count: item.count
    }));
  }

  res.status(200).json({
    success: true,
    data: stats[0]
  });
});