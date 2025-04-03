import {
    Evidence,
    ImageEvidence,
    TextEvidence,
  } from "../models/evidence.model.js";
  import Case from "../models/case.model.js";
  import ErrorResponse from "../utils/errorResponse.js";
  import asyncHandler from "../utils/asyncHandler.js";
  
  // @desc    Obter todas as evidências
  // @route   GET /api/evidence
  // @access  Privado
  export const getAllEvidence = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advancedResults);
  });
  
  // @desc    Obter evidência por ID
  // @route   GET /api/evidence/:id
  // @access  Privado
  export const getEvidence = asyncHandler(async (req, res, next) => {
    const evidence = await Evidence.findById(req.params.id)
      .populate("collectedBy", "name email")
      .populate("case", "title status");
  
    if (!evidence) {
      return next(
        new ErrorResponse(`Evidence not found with id of ${req.params.id}`, 404)
      );
    }
  
    // Verificar se o usuário tem acesso ao caso ao qual esta evidência pertence
    const forensicCase = await Case.findById(evidence.case);
  
    if (
      forensicCase.assignedTo.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      forensicCase.createdBy.toString() !== req.user.id
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to access this evidence`,
          403
        )
      );
    }
  
    res.status(200).json({
      success: true,
      data: evidence,
    });
  });
  
  // @desc    Criar nova evidência
  // @route   POST /api/evidence
  // @access  Privado
  export const createEvidence = asyncHandler(async (req, res, next) => {
    // Adicionar usuário como coletor
    req.body.collectedBy = req.user.id;
  
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
          `User ${req.user.id} is not authorized to add evidence to this case`,
          403
        )
      );
    }
  
    let evidence;
  
    // Criar o tipo apropriado de evidência
    if (req.body.type === "image") {
      evidence = await ImageEvidence.create(req.body);
    } else if (req.body.type === "text") {
      evidence = await TextEvidence.create(req.body);
    } else {
      return next(
        new ErrorResponse(`Invalid evidence type: ${req.body.type}`, 400)
      );
    }
  
    res.status(201).json({
      success: true,
      data: evidence,
    });
  });
  
  // @desc    Atualizar evidência
  // @route   PUT /api/evidence/:id
  // @access  Privado
  export const updateEvidence = asyncHandler(async (req, res, next) => {
    let evidence = await Evidence.findById(req.params.id);
  
    if (!evidence) {
      return next(
        new ErrorResponse(`Evidence not found with id of ${req.params.id}`, 404)
      );
    }
  
    // Verificar se o usuário tem acesso ao caso ao qual esta evidência pertence
    const forensicCase = await Case.findById(evidence.case);
  
    if (
      forensicCase.assignedTo.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      forensicCase.createdBy.toString() !== req.user.id
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this evidence`,
          403
        )
      );
    }
  
    // Não permitir alteração do tipo de evidência ou caso
    delete req.body.type;
    delete req.body.case;
  
    evidence = await Evidence.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
  
    res.status(200).json({
      success: true,
      data: evidence,
    });
  });
  
  // @desc    Excluir evidência
  // @route   DELETE /api/evidence/:id
  // @access  Privado
  export const deleteEvidence = asyncHandler(async (req, res, next) => {
    const evidence = await Evidence.findById(req.params.id);
  
    if (!evidence) {
      return next(
        new ErrorResponse(`Evidence not found with id of ${req.params.id}`, 404)
      );
    }
  
    // Verificar se o usuário tem acesso ao caso ao qual esta evidência pertence
    const forensicCase = await Case.findById(evidence.case);
  
    if (
      forensicCase.assignedTo.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      forensicCase.createdBy.toString() !== req.user.id
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete this evidence`,
          403
        )
      );
    }
  
    await evidence.remove();
  
    res.status(200).json({
      success: true,
      data: {},
    });
  });
  
  // @desc    Obter evidências para um caso específico
  // @route   GET /api/cases/:caseId/evidence
  // @access  Privado
  export const getCaseEvidence = asyncHandler(async (req, res, next) => {
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
          `User ${req.user.id} is not authorized to access evidence for this case`,
          403
        )
      );
    }
  
    const evidence = await Evidence.find({ case: req.params.caseId }).populate(
      "collectedBy",
      "name email"
    );
  
    res.status(200).json({
      success: true,
      count: evidence.length,
      data: evidence,
    });
  });
  