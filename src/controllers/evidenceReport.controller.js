import EvidenceReport from "../models/evidenceReport.model.js"
import { Evidence } from "../models/evidence.model.js"
import Case from "../models/case.model.js"
import User from "../models/user.model.js"
import ErrorResponse from "../utils/errorResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { generateEvidenceReportPDF } from "../utils/evidenceReportPdfGenerator.js"
import { signDocument, verifySignature, verifyDocumentByHash } from "../utils/digitalSignature.js"
import path from "path"
import { fileURLToPath } from "url"

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// @desc    Obter todos os relatórios de evidências
// @route   GET /api/evidence-reports
// @access  Privado
export const getEvidenceReports = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Obter um relatório de evidência específico
// @route   GET /api/evidence-reports/:id
// @access  Privado
export const getEvidenceReport = asyncHandler(async (req, res, next) => {
  const evidenceReport = await EvidenceReport.findById(req.params.id)
    .populate("evidence", "type description imageUrl content")
    .populate("case", "title status")
    .populate("expertResponsible", "name email")

  if (!evidenceReport) {
    return next(new ErrorResponse(`Relatório de evidência não encontrado com id ${req.params.id}`, 404))
  }

  // Verificar se o usuário tem acesso ao caso ao qual este relatório pertence
  const forensicCase = await Case.findById(evidenceReport.case)

  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(`Usuário ${req.user.id} não está autorizado a acessar este relatório de evidência`, 403),
    )
  }

  res.status(200).json({
    success: true,
    data: evidenceReport,
  })
})

// @desc    Criar novo relatório de evidência
// @route   POST /api/evidence-reports
// @access  Privado
export const createEvidenceReport = asyncHandler(async (req, res, next) => {
  // Definir perito responsável como usuário atual
  req.body.expertResponsible = req.user.id

  // Verificar se a evidência existe
  const evidence = await Evidence.findById(req.body.evidence)
  if (!evidence) {
    return next(new ErrorResponse(`Evidência não encontrada com id ${req.body.evidence}`, 404))
  }

  // Obter o caso da evidência e definir no relatório
  req.body.case = evidence.case

  // Verificar se o caso existe
  const forensicCase = await Case.findById(req.body.case)
  if (!forensicCase) {
    return next(new ErrorResponse(`Caso não encontrado com id ${req.body.case}`, 404))
  }

  // Verificar se o usuário tem acesso ao caso
  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(`Usuário ${req.user.id} não está autorizado a criar relatórios para este caso/evidência`, 403),
    )
  }

  // Adicionar metadados específicos do tipo de evidência
  if (evidence.type === "image") {
    req.body.evidenceMetadata = {
      imageType: evidence.imageType || "outro",
      dimensions: evidence.cloudinary
        ? { width: evidence.cloudinary.width, height: evidence.cloudinary.height }
        : undefined,
      format: evidence.cloudinary ? evidence.cloudinary.format : undefined,
    }
  } else if (evidence.type === "text") {
    req.body.evidenceMetadata = {
      contentType: evidence.contentType || "outro",
      wordCount: evidence.content ? evidence.content.split(/\s+/).length : 0,
    }
  }

  const evidenceReport = await EvidenceReport.create(req.body)

  res.status(201).json({
    success: true,
    data: evidenceReport,
  })
})

// @desc    Atualizar relatório de evidência
// @route   PUT /api/evidence-reports/:id
// @access  Privado
export const updateEvidenceReport = asyncHandler(async (req, res, next) => {
  let evidenceReport = await EvidenceReport.findById(req.params.id)

  if (!evidenceReport) {
    return next(new ErrorResponse(`Relatório de evidência não encontrado com id ${req.params.id}`, 404))
  }

  // Verificar se o usuário tem acesso ao caso ao qual este relatório pertence
  const forensicCase = await Case.findById(evidenceReport.case)

  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(`Usuário ${req.user.id} não está autorizado a atualizar este relatório de evidência`, 403),
    )
  }

  // Não permitir alteração da evidência, caso ou perito responsável
  delete req.body.evidence
  delete req.body.case
  delete req.body.expertResponsible

  // Se o status estiver sendo alterado para 'assinado', adicionar assinatura digital
  if (req.body.status === "assinado" && evidenceReport.status !== "assinado") {
    // Obter informações completas do usuário
    const user = await User.findById(req.user.id)

    // Gerar assinatura digital
    req.body.digitalSignature = signDocument(evidenceReport, user)
  }

  // Não permitir alterações em relatórios já assinados
  if (evidenceReport.status === "assinado") {
    return next(new ErrorResponse("Não é possível modificar um relatório já assinado", 400))
  }

  evidenceReport = await EvidenceReport.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: evidenceReport,
  })
})

// @desc    Excluir relatório de evidência
// @route   DELETE /api/evidence-reports/:id
// @access  Privado
export const deleteEvidenceReport = asyncHandler(async (req, res, next) => {
  const evidenceReport = await EvidenceReport.findById(req.params.id)

  if (!evidenceReport) {
    return next(new ErrorResponse(`Relatório de evidência não encontrado com id ${req.params.id}`, 404))
  }

  // Verificar se o usuário tem acesso ao caso ao qual este relatório pertence
  const forensicCase = await Case.findById(evidenceReport.case)

  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(`Usuário ${req.user.id} não está autorizado a excluir este relatório de evidência`, 403),
    )
  }

  // Não permitir exclusão de relatórios assinados
  if (evidenceReport.status === "assinado") {
    return next(new ErrorResponse(`Não é possível excluir um relatório assinado`, 400))
  }

  await evidenceReport.remove()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Obter relatórios para uma evidência específica
// @route   GET /api/evidence/:evidenceId/reports
// @access  Privado
export const getEvidenceReportsByEvidence = asyncHandler(async (req, res, next) => {
  const evidence = await Evidence.findById(req.params.evidenceId)

  if (!evidence) {
    return next(new ErrorResponse(`Evidência não encontrada com id ${req.params.evidenceId}`, 404))
  }

  // Verificar se o usuário tem acesso ao caso ao qual esta evidência pertence
  const forensicCase = await Case.findById(evidence.case)

  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(`Usuário ${req.user.id} não está autorizado a acessar relatórios para esta evidência`, 403),
    )
  }

  const evidenceReports = await EvidenceReport.find({ evidence: req.params.evidenceId }).populate(
    "expertResponsible",
    "name email",
  )

  res.status(200).json({
    success: true,
    count: evidenceReports.length,
    data: evidenceReports,
  })
})

// @desc    Exportar relatório de evidência como PDF
// @route   GET /api/evidence-reports/:id/pdf
// @access  Privado
export const exportEvidenceReportPDF = asyncHandler(async (req, res, next) => {
  const evidenceReport = await EvidenceReport.findById(req.params.id)
    .populate({
      path: "evidence",
      populate: {
        path: "collectedBy",
        select: "name email",
      },
    })
    .populate("case")
    .populate("expertResponsible")

  if (!evidenceReport) {
    return next(new ErrorResponse(`Relatório de evidência não encontrado com id ${req.params.id}`, 404))
  }

  // Verificar se o usuário tem acesso ao caso ao qual este relatório pertence
  const forensicCase = await Case.findById(evidenceReport.case)

  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(`Usuário ${req.user.id} não está autorizado a acessar este relatório de evidência`, 403),
    )
  }

  try {
    // Caminho para o logo (opcional)
    const logoPath = path.join(__dirname, "../public/assets/logo.png")

    // Opções para geração do PDF
    const options = {
      logoPath: logoPath,
    }

    // Gerar o PDF
    const pdfBuffer = await generateEvidenceReportPDF(
      evidenceReport,
      evidenceReport.evidence,
      forensicCase,
      evidenceReport.expertResponsible,
      options,
    )

    // Configurar cabeçalhos para download do PDF
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="evidence-report-${evidenceReport._id}.pdf"`)
    res.setHeader("Content-Length", pdfBuffer.length)

    // Adicione logs para depuração
    console.log("Enviando PDF:", {
      contentType: "application/pdf",
      contentLength: pdfBuffer.length,
      filename: `evidence-report-${evidenceReport._id}.pdf`,
    })

    // Enviar o PDF como resposta
    res.send(pdfBuffer)
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    return next(new ErrorResponse(`Erro ao gerar PDF: ${error.message}`, 500))
  }
})

// @desc    Assinar digitalmente um relatório de evidência
// @route   POST /api/evidence-reports/:id/sign
// @access  Privado
export const signEvidenceReport = asyncHandler(async (req, res, next) => {
  const evidenceReport = await EvidenceReport.findById(req.params.id)

  if (!evidenceReport) {
    return next(new ErrorResponse(`Relatório de evidência não encontrado com id ${req.params.id}`, 404))
  }

  // Verificar se o usuário tem acesso ao caso ao qual este relatório pertence
  const forensicCase = await Case.findById(evidenceReport.case)

  if (forensicCase.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(`Usuário ${req.user.id} não está autorizado a assinar este relatório de evidência`, 403),
    )
  }

  // Verificar se o relatório já está assinado
  if (evidenceReport.status === "assinado") {
    return next(new ErrorResponse(`Relatório já está assinado`, 400))
  }

  // Verificar se o relatório está em estado que pode ser assinado
  if (evidenceReport.status !== "finalizado") {
    return next(new ErrorResponse(`Relatório deve estar no status 'finalizado' para ser assinado`, 400))
  }

  // Obter informações completas do usuário
  const user = await User.findById(req.user.id)

  // Gerar assinatura digital
  const digitalSignature = signDocument(evidenceReport, user)

  // Atualizar o relatório com a assinatura digital
  evidenceReport.digitalSignature = digitalSignature
  evidenceReport.status = "assinado"
  await evidenceReport.save()

  res.status(200).json({
    success: true,
    data: evidenceReport,
  })
})

// @desc    Verificar assinatura digital de um relatório de evidência
// @route   GET /api/evidence-reports/:id/verify
// @access  Privado
export const verifyEvidenceReportSignature = asyncHandler(async (req, res, next) => {
  const evidenceReport = await EvidenceReport.findById(req.params.id).populate("expertResponsible", "name email")

  if (!evidenceReport) {
    return next(new ErrorResponse(`Relatório de evidência não encontrado com id ${req.params.id}`, 404))
  }

  // Verificar se o relatório está assinado
  if (evidenceReport.status !== "assinado" || !evidenceReport.digitalSignature) {
    return next(new ErrorResponse(`Relatório não está assinado`, 400))
  }

  // Verificar assinatura digital
  const verificationResult = verifySignature(evidenceReport, evidenceReport.digitalSignature)

  res.status(200).json({
    success: true,
    data: verificationResult,
  })
})

// @desc    Verificar relatório por hash e código de verificação (acesso público)
// @route   GET /api/evidence-reports/verify/:id
// @access  Público
export const verifyEvidenceReportByHash = asyncHandler(async (req, res, next) => {
  const { hash, code } = req.query

  if (!hash || !code) {
    return next(new ErrorResponse(`Hash e código de verificação são obrigatórios`, 400))
  }

  const evidenceReport = await EvidenceReport.findById(req.params.id).populate("expertResponsible", "name email")

  if (!evidenceReport) {
    return next(new ErrorResponse(`Relatório de evidência não encontrado com id ${req.params.id}`, 404))
  }

  // Verificar documento usando hash e código
  const verificationResult = verifyDocumentByHash(req.params.id, hash, code, evidenceReport)

  res.status(200).json({
    success: true,
    data: verificationResult,
  })
})
