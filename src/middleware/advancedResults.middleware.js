
const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  // Cópia do req.query
  const reqQuery = { ...req.query };

  // Campos a serem excluídos da filtragem
  const removeFields = ["select", "sort", "page", "limit", "from", "to", "fields"];

  // Loop sobre removeFields e exclusão do reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  // Tratamento de filtros de data
  const dateFilters = {};
  
  // Filtro por intervalo de datas para openDate
  if (req.query.from) {
    dateFilters.openDate = { $gte: new Date(req.query.from) };
  }
  
  if (req.query.to) {
    if (dateFilters.openDate) {
      dateFilters.openDate.$lte = new Date(req.query.to);
    } else {
      dateFilters.openDate = { $lte: new Date(req.query.to) };
    }
  }

  // Filtro por intervalo de datas para createdAt
  if (req.query.createdFrom) {
    dateFilters.createdAt = { $gte: new Date(req.query.createdFrom) };
  }
  
  if (req.query.createdTo) {
    if (dateFilters.createdAt) {
      dateFilters.createdAt.$lte = new Date(req.query.createdTo);
    } else {
      dateFilters.createdAt = { $lte: new Date(req.query.createdTo) };
    }
  }

  // Filtro por intervalo de datas para updatedAt
  if (req.query.updatedFrom) {
    dateFilters.updatedAt = { $gte: new Date(req.query.updatedFrom) };
  }
  
  if (req.query.updatedTo) {
    if (dateFilters.updatedAt) {
      dateFilters.updatedAt.$lte = new Date(req.query.updatedTo);
    } else {
      dateFilters.updatedAt = { $lte: new Date(req.query.updatedTo) };
    }
  }

  // Filtro por múltiplos valores (como status)
  if (req.query.status && req.query.status.includes(',')) {
    const statusValues = req.query.status.split(',');
    reqQuery.status = { $in: statusValues };
  }

  // Filtro por múltiplos responsáveis
  if (req.query.assignedTo && req.query.assignedTo.includes(',')) {
    const assignedToValues = req.query.assignedTo.split(',').map(id => id.trim());
    reqQuery.assignedTo = { $in: assignedToValues };
  }

  // Filtro por múltiplos criadores
  if (req.query.createdBy && req.query.createdBy.includes(',')) {
    const createdByValues = req.query.createdBy.split(',').map(id => id.trim());
    reqQuery.createdBy = { $in: createdByValues };
  }

  // Criar string de consulta
  let queryStr = JSON.stringify(reqQuery);

  // Criar operadores ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|nin|eq|ne|regex)\b/g, (match) => `$${match}`);

  // Combinar filtros de consulta e filtros de data
  const parsedQuery = JSON.parse(queryStr);
  const finalQuery = { ...parsedQuery, ...dateFilters };

  // Buscar recursos
  query = model.find(finalQuery);

  // Busca por texto (para título e descrição)
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query = query.or([
      { title: searchRegex },
      { description: searchRegex }
    ]);
  }

  // Selecionar campos
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Selecionar campos específicos (alternativa mais flexível)
  if (req.query.fields) {
    try {
      const fieldsObj = JSON.parse(req.query.fields);
      query = query.select(fieldsObj);
    } catch (err) {
      console.error('Erro ao analisar campos JSON:', err);
    }
  }

  // Ordenação
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Paginação
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Contar documentos antes de aplicar paginação
  const total = await model.countDocuments(finalQuery);

  query = query.skip(startIndex).limit(limit);

  // População
  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(item => {
        query = query.populate(item);
      });
    } else {
      query = query.populate(populate);
    }
  }

  // Executar consulta
  const results = await query;

  // Resultado da paginação
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  // Adicionar informações de paginação
  pagination.total = total;
  pagination.pages = Math.ceil(total / limit);
  pagination.currentPage = page;

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };

  next();
};

export default advancedResults;