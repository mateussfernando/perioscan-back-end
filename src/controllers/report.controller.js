import Report from "../models/report.model.js";
import Case from "../models/case.model.js";
import { Evidence } from "../models/evidence.model.js";
import ErrorResponse from "../utils/errorResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateReportPDF } from "../utils/pdfGenerator.js";

// @desc    Obter todos os laudos
// @route   GET /api/reports
// @access  Privado
export const getReports = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obter um laudo específico
// @route   GET /api/reports/:id
// @access  Privado
export const getReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id)
    .populate("case", "title status")
    .populate("expertResponsible", "name email")
    .populate("attachments");

  if (!report) {
    return next(
      new ErrorResponse(`Report not found with id of ${req.params.id}`, 404)
    );
  }

  // Verificar se o usuário tem acesso ao caso ao qual este laudo pertence
  const forensicCase = await Case.findById(report.case);

  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this report`,
        403
      )
    );
  }

  res.status(200).json({
    success: true,
    data: report,
  });
});

// @desc    Criar novo laudo
// @route   POST /api/reports
// @access  Privado
export const createReport = asyncHandler(async (req, res, next) => {
  // Definir perito responsável como usuário atual
  req.body.expertResponsible = req.user.id;

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
        `User ${req.user.id} is not authorized to create reports for this case`,
        403
      )
    );
  }

  const report = await Report.create(req.body);

  res.status(201).json({
    success: true,
    data: report,
  });
});

// @desc    Atualizar laudo
// @route   PUT /api/reports/:id
// @access  Privado
export const updateReport = asyncHandler(async (req, res, next) => {
  let report = await Report.findById(req.params.id);

  if (!report) {
    return next(
      new ErrorResponse(`Report not found with id of ${req.params.id}`, 404)
    );
  }

  // Verificar se o usuário tem acesso ao caso ao qual este laudo pertence
  const forensicCase = await Case.findById(report.case);

  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this report`,
        403
      )
    );
  }

  // Não permitir alteração do caso ou perito responsável
  delete req.body.case;
  delete req.body.expertResponsible;

  // Se o status estiver sendo alterado para 'assinado', adicionar assinatura digital
  if (req.body.status === "assinado" && report.status !== "assinado") {
    req.body.digitalSignature = {
      signedBy: req.user.id,
      signatureDate: Date.now(),
      signatureData: `Signed by ${req.user.id} at ${new Date().toISOString()}`,
    };
  }

  report = await Report.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: report,
  });
});

// @desc    Excluir laudo
// @route   DELETE /api/reports/:id
// @access  Privado
export const deleteReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(
      new ErrorResponse(`Report not found with id of ${req.params.id}`, 404)
    );
  }

  // Verificar se o usuário tem acesso ao caso ao qual este laudo pertence
  const forensicCase = await Case.findById(report.case);

  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this report`,
        403
      )
    );
  }

  // Não permitir exclusão de laudos assinados
  if (report.status === "assinado") {
    return next(new ErrorResponse(`Cannot delete a signed report`, 400));
  }

  await report.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Obter laudos para um caso específico
// @route   GET /api/cases/:caseId/reports
// @access  Privado
export const getCaseReports = asyncHandler(async (req, res, next) => {
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
        `User ${req.user.id} is not authorized to access reports for this case`,
        403
      )
    );
  }

  const reports = await Report.find({ case: req.params.caseId }).populate(
    "expertResponsible",
    "name email"
  );

  res.status(200).json({
    success: true,
    count: reports.length,
    data: reports,
  });
});

// @desc    Exportar laudo como PDF
// @route   GET /api/reports/:id/pdf
// @access  Privado
export const exportReportPDF = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id)
    .populate("case")
    .populate("expertResponsible")
    .populate("attachments");

  if (!report) {
    return next(
      new ErrorResponse(`Report not found with id of ${req.params.id}`, 404)
    );
  }

  // Verificar se o usuário tem acesso ao caso ao qual este laudo pertence
  const forensicCase = await Case.findById(report.case);

  if (
    forensicCase.assignedTo.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    forensicCase.createdBy.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to access this report`,
        403
      )
    );
  }

  // Obter evidências anexadas ao laudo
  const evidences = await Evidence.find({
    _id: { $in: report.attachments },
  });

  try {
    // Gerar o PDF
    const pdfBuffer = await generateReportPDF(
      report,
      forensicCase,
      report.expertResponsible,
      evidences
    );

    // Configurar cabeçalhos para download do PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="report-${report._id}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Enviar o PDF como resposta
    res.send(pdfBuffer);
  } catch (error) {
    return next(
      new ErrorResponse(`Error generating PDF: ${error.message}`, 500)
    );
  }
});
