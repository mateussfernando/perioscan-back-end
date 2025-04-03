import ComparisonResult from "../models/comparison.model.js";
import Case from "../models/case.model.js";
import { Evidence } from "../models/evidence.model.js";
import ErrorResponse from "../utils/errorResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Obter todos os resultados de comparação
// @route   GET /api/comparisons
// @access  Privado
export const getComparisons = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obter um resultado de comparação específico
// @route   GET /api/comparisons/:id
// @access  Privado
export const getComparison = asyncHandler(async (req, res, next) => {
  const comparison = await ComparisonResult.findById(req.params.id)
    .populate("analyzedBy", "name email")
    .populate("sourceEvidence")
    .populate("targetEvidence")
    .populate("case", "title status");

  if (!comparison) {
    return next(
      new ErrorResponse(`Comparison not found with id of ${req.params.id}`, 404)
    );
  }

  // Verificar se o usuário tem acesso ao caso ao qual esta comparação pertence
  const forensicCase = await Case.findById(comparison.case);

  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this comparison`,
        403
      )
    );
  }

  res.status(200).json({
    success: true,
    data: comparison,
  });
});

// @desc    Criar nova comparação
// @route   POST /api/comparisons
// @access  Privado
export const createComparison = asyncHandler(async (req, res, next) => {
  // Definir analisador como usuário atual
  req.body.analyzedBy = req.user.id;

  // Verificar se o caso existe
  const forensicCase = await Case.findById(req.body.case);

  if (!forensicCase) {
    return next(
      new ErrorResponse(`Case not found with id of ${req.body.case}`, 404)
    );
  }

  // Verificar se o usuário tem acesso ao caso
  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to create comparisons for this case`,
        403
      )
    );
  }

  // Verificar se a evidência de origem existe e pertence ao caso
  const sourceEvidence = await Evidence.findById(req.body.sourceEvidence);
  if (!sourceEvidence || sourceEvidence.case.toString() !== req.body.case) {
    return next(new ErrorResponse(`Invalid source evidence`, 400));
  }

  // Verificar se a evidência alvo existe e pertence ao caso
  const targetEvidence = await Evidence.findById(req.body.targetEvidence);
  if (!targetEvidence || targetEvidence.case.toString() !== req.body.case) {
    return next(new ErrorResponse(`Invalid target evidence`, 400));
  }

  const comparison = await ComparisonResult.create(req.body);

  res.status(201).json({
    success: true,
    data: comparison,
  });
});

// @desc    Atualizar comparação
// @route   PUT /api/comparisons/:id
// @access  Privado
export const updateComparison = asyncHandler(async (req, res, next) => {
  let comparison = await ComparisonResult.findById(req.params.id);

  if (!comparison) {
    return next(
      new ErrorResponse(`Comparison not found with id of ${req.params.id}`, 404)
    );
  }

  // Verificar se o usuário tem acesso ao caso ao qual esta comparação pertence
  const forensicCase = await Case.findById(comparison.case);

  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this comparison`,
        403
      )
    );
  }

  // Não permitir alteração do caso, evidência de origem, evidência alvo ou analisador
  delete req.body.case;
  delete req.body.sourceEvidence;
  delete req.body.targetEvidence;
  delete req.body.analyzedBy;

  comparison = await ComparisonResult.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: comparison,
  });
});

// @desc    Excluir comparação
// @route   DELETE /api/comparisons/:id
// @access  Privado
export const deleteComparison = asyncHandler(async (req, res, next) => {
  const comparison = await ComparisonResult.findById(req.params.id);

  if (!comparison) {
    return next(
      new ErrorResponse(`Comparison not found with id of ${req.params.id}`, 404)
    );
  }

  // Verificar se o usuário tem acesso ao caso ao qual esta comparação pertence
  const forensicCase = await Case.findById(comparison.case);

  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this comparison`,
        403
      )
    );
  }

  await comparison.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Obter comparações para um caso específico
// @route   GET /api/cases/:caseId/comparisons
// @access  Privado
export const getCaseComparisons = asyncHandler(async (req, res, next) => {
  const forensicCase = await Case.findById(req.params.caseId);

  if (!forensicCase) {
    return next(
      new ErrorResponse(`Case not found with id of ${req.params.caseId}`, 404)
    );
  }

  // Verificar se o usuário tem acesso ao caso
  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access comparisons for this case`,
        403
      )
    );
  }

  const comparisons = await ComparisonResult.find({ case: req.params.caseId })
    .populate("analyzedBy", "name email")
    .populate("sourceEvidence", "type")
    .populate("targetEvidence", "type");

  res.status(200).json({
    success: true,
    count: comparisons.length,
    data: comparisons,
  });
});
