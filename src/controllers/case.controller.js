import Case from "../models/case.model.js";
import ErrorResponse from "../utils/errorResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Obter todos os casos
// @route   GET /api/cases
// @access  Privado
export const getCases = asyncHandler(async (req, res, next) => {
  // Para usuários não-admin, mostrar apenas casos atribuídos a eles
  if (req.user.role !== "admin") {
    req.query.assignedTo = req.user.id;
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
    .populate("reports");

  if (!forensicCase) {
    return next(
      new ErrorResponse(`Case not found with id of ${req.params.id}`, 404)
    );
  }

  // Verificar se o usuário é o responsável pelo caso ou tem cargo de admin
  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this case`,
        403
      )
    );
  }

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

  // Se o usuário não for admin, só pode atribuir casos a si mesmo
  if (req.user.role !== "admin" && req.body.assignedTo !== req.user.id) {
    req.body.assignedTo = req.user.id;
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

  // Verificar se o usuário é o responsável pelo caso ou tem cargo de admin
  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this case`,
        403
      )
    );
  }

  // Se o usuário não for admin, não pode reatribuir o caso a outra pessoa
  if (
    req.user.role !== "admin" &&
    req.body.assignedTo &&
    req.body.assignedTo !== req.user.id
  ) {
    delete req.body.assignedTo;
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

  // Verificar se o usuário é o responsável pelo caso ou tem cargo de admin
  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this case`,
        403
      )
    );
  }

  await forensicCase.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
