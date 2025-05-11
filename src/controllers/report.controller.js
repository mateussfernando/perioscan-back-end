import Report from "../models/report.model.js"
import Case from "../models/case.model.js"
import User from "../models/user.model.js"
import { Evidence } from "../models/evidence.model.js"
import asyncHandler from "../utils/asyncHandler.js"
import { generateReportPDF } from "../utils/pdfGenerator.js"
import { signDocument, verifySignature, verifyDocumentByHash } from "../utils/digitalSignature.js"
import path from "path"
import { fileURLToPath } from "url"

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// @desc    Obter todos os laudos
// @route   GET /api/reports
// @access  Privado
export const getReports = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Obter um laudo específico
// @route   GET /api/reports/:id
// @access  Privado
export const getReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id)
    .populate("case", "title status")
    .populate("expertResponsible", "name email")
    .populate("attachments")

  if (!report) {
    const error = new Error(`Report not found with id of ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar se o usuário tem acesso ao caso ao qual este laudo pertence
  const forensicCase = await Case.findById(report.case)

  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error(`User ${req.user.id} is not authorized to access this report`)
    error.statusCode = 403
    return next(error)
  }

  res.status(200).json({
    success: true,
    data: report,
  })
})

// @desc    Criar novo laudo
// @route   POST /api/reports
// @access  Privado
export const createReport = asyncHandler(async (req, res, next) => {
  // Definir perito responsável como usuário atual
  req.body.expertResponsible = req.user.id

  // Verificar se o caso existe
  const forensicCase = await Case.findById(req.body.case)

  if (!forensicCase) {
    const error = new Error(`Case not found with id of ${req.body.case}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar se o usuário tem acesso ao caso
  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error(`User ${req.user.id} is not authorized to create reports for this case`)
    error.statusCode = 403
    return next(error)
  }

  const report = await Report.create(req.body)

  res.status(201).json({
    success: true,
    data: report,
  })
})

// @desc    Atualizar laudo
// @route   PUT /api/reports/:id
// @access  Privado
export const updateReport = asyncHandler(async (req, res, next) => {
  let report = await Report.findById(req.params.id)

  if (!report) {
    const error = new Error(`Report not found with id of ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar se o usuário tem acesso ao caso ao qual este laudo pertence
  const forensicCase = await Case.findById(report.case)

  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error(`User ${req.user.id} is not authorized to update this report`)
    error.statusCode = 403
    return next(error)
  }

  // Não permitir alteração do caso ou perito responsável
  delete req.body.case
  delete req.body.expertResponsible

  // Se o status estiver sendo alterado para 'assinado', adicionar assinatura digital
  if (req.body.status === "assinado" && report.status !== "assinado") {
    // Obter informações completas do usuário
    const user = await User.findById(req.user.id)

    // Gerar assinatura digital
    req.body.digitalSignature = signDocument(report, user)
  }

  // Não permitir alterações em laudos já assinados
  if (report.status === "assinado") {
    const error = new Error("Não é possível modificar um laudo já assinado")
    error.statusCode = 400
    return next(error)
  }

  report = await Report.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: report,
  })
})

// @desc    Excluir laudo
// @route   DELETE /api/reports/:id
// @access  Privado
export const deleteReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id)

  if (!report) {
    const error = new Error(`Report not found with id of ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar se o usuário tem acesso ao caso ao qual este laudo pertence
  const forensicCase = await Case.findById(report.case)

  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error(`User ${req.user.id} is not authorized to delete this report`)
    error.statusCode = 403
    return next(error)
  }

  // Não permitir exclusão de laudos assinados
  if (report.status === "assinado") {
    const error = new Error(`Cannot delete a signed report`)
    error.statusCode = 400
    return next(error)
  }

  try {
    await report.deleteOne()

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    console.error("Erro ao excluir relatório:", error)
    const err = new Error(`Erro ao excluir relatório: ${error.message}`)
    err.statusCode = 500
    return next(err)
  }
})

// @desc    Obter laudos para um caso específico
// @route   GET /api/cases/:caseId/reports
// @access  Privado
export const getCaseReports = asyncHandler(async (req, res, next) => {
  const forensicCase = await Case.findById(req.params.caseId)

  if (!forensicCase) {
    const error = new Error(`Case not found with id of ${req.params.caseId}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar se o usuário tem acesso ao caso
  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error(`User ${req.user.id} is not authorized to access reports for this case`)
    error.statusCode = 403
    return next(error)
  }

  const reports = await Report.find({ case: req.params.caseId }).populate("expertResponsible", "name email")

  res.status(200).json({
    success: true,
    count: reports.length,
    data: reports,
  })
})

// @desc    Exportar laudo como PDF
// @route   GET /api/reports/:id/pdf
// @access  Privado
export const exportReportPDF = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id)
    .populate("case")
    .populate("expertResponsible")
    .populate("attachments")

  if (!report) {
    const error = new Error(`Report not found with id of ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar se o usuário tem acesso ao caso ao qual este laudo pertence
  const forensicCase = await Case.findById(report.case)

  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error(`User ${req.user.id} is not authorized to access this report`)
    error.statusCode = 403
    return next(error)
  }

  // Obter evidências anexadas ao laudo
  const evidences = await Evidence.find({
    _id: { $in: report.attachments },
  })

  try {
    // Caminho para o logo (opcional)
    const logoPath = path.join(__dirname, "../public/assets/logo.png")

    // Opções para geração do PDF
    const options = {
      logoPath: logoPath,
    }

    // Gerar o PDF
    const pdfBuffer = await generateReportPDF(report, forensicCase, report.expertResponsible, evidences, options)

    // Configurar cabeçalhos para download do PDF
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="report-${report._id}.pdf"`)
    res.setHeader("Content-Length", pdfBuffer.length)

    // Adicione logs para depuração
    console.log("Enviando PDF:", {
      contentType: "application/pdf",
      contentLength: pdfBuffer.length,
      filename: `report-${report._id}.pdf`,
    })

    // Enviar o PDF como resposta
    res.send(pdfBuffer)
  } catch (error) {
    const err = new Error(`Error generating PDF: ${error.message}`)
    err.statusCode = 500
    return next(err)
  }
})

// @desc    Assinar digitalmente um laudo
// @route   POST /api/reports/:id/sign
// @access  Privado
export const signReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id)

  if (!report) {
    const error = new Error(`Report not found with id of ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar se o usuário tem acesso ao caso ao qual este laudo pertence
  const forensicCase = await Case.findById(report.case)

  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    const error = new Error(`User ${req.user.id} is not authorized to sign this report`)
    error.statusCode = 403
    return next(error)
  }

  // Verificar se o laudo já está assinado
  if (report.status === "assinado") {
    const error = new Error(`Report is already signed`)
    error.statusCode = 400
    return next(error)
  }

  // Verificar se o laudo está em estado que pode ser assinado
  if (report.status !== "finalizado") {
    const error = new Error(`Report must be in 'finalizado' status to be signed`)
    error.statusCode = 400
    return next(error)
  }

  // Obter informações completas do usuário
  const user = await User.findById(req.user.id)

  // Gerar assinatura digital
  const digitalSignature = signDocument(report, user)

  // Atualizar o laudo com a assinatura digital
  report.digitalSignature = digitalSignature
  report.status = "assinado"
  await report.save()

  res.status(200).json({
    success: true,
    data: report,
  })
})

// @desc    Verificar assinatura digital de um laudo
// @route   GET /api/reports/:id/verify
// @access  Privado
export const verifyReportSignature = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id).populate("expertResponsible", "name email")

  if (!report) {
    const error = new Error(`Report not found with id of ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar se o laudo está assinado
  if (report.status !== "assinado" || !report.digitalSignature) {
    const error = new Error(`Report is not signed`)
    error.statusCode = 400
    return next(error)
  }

  // Verificar assinatura digital
  const verificationResult = verifySignature(report, report.digitalSignature)

  res.status(200).json({
    success: true,
    data: verificationResult,
  })
})

// @desc    Verificar laudo por hash e código de verificação (acesso público)
// @route   GET /api/reports/verify/:id
// @access  Público
export const verifyReportByHash = asyncHandler(async (req, res, next) => {
  const { hash, code } = req.query

  if (!hash || !code) {
    const error = new Error(`Hash and verification code are required`)
    error.statusCode = 400
    return next(error)
  }

  const report = await Report.findById(req.params.id).populate("expertResponsible", "name email")

  if (!report) {
    const error = new Error(`Report not found with id of ${req.params.id}`)
    error.statusCode = 404
    return next(error)
  }

  // Verificar documento usando hash e código
  const verificationResult = verifyDocumentByHash(req.params.id, hash, code, report)

  res.status(200).json({
    success: true,
    data: verificationResult,
  })
})
