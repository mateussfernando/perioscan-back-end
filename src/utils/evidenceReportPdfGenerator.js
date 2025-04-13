import PDFDocument from "pdfkit"
import moment from "moment"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import QRCode from "qrcode"
import crypto from "crypto"

// Configurar moment para português do Brasil
moment.locale("pt-br")

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cores para o documento
const colors = {
  primary: "#003366",
  secondary: "#0066cc",
  accent: "#ff9900",
  light: "#f5f5f5",
  text: "#333333",
  lightText: "#666666",
  success: "#28a745",
  warning: "#ffc107",
  danger: "#dc3545",
}

// Fontes personalizadas
const fonts = {
  normal: "Helvetica",
  bold: "Helvetica-Bold",
  italic: "Helvetica-Oblique",
  boldItalic: "Helvetica-BoldOblique",
}

/**
 * Gera um PDF para um relatório de evidência
 * @param {Object} report - O relatório a ser convertido em PDF
 * @param {Object} evidence - A evidência relacionada ao relatório
 * @param {Object} forensicCase - O caso relacionado ao relatório
 * @param {Object} expert - O perito responsável pelo relatório
 * @param {Object} options - Opções adicionais para a geração do PDF
 * @returns {Promise<Buffer>} - Buffer contendo o PDF gerado
 */
export const generateEvidenceReportPDF = async (report, evidence, forensicCase, expert, options = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Criar um buffer para armazenar o PDF
      const buffers = []

      // Criar um novo documento PDF
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Relatório de Evidência - ${report.title}`,
          Author: expert.name,
          Subject: "Relatório de Evidência Odontológica Forense",
          Keywords: "odontologia legal, evidência, relatório, forense",
          Creator: "Sistema de Gestão Odontológica Forense - PerioScan",
          CreationDate: new Date(),
        },
        autoFirstPage: true,
      })

      // Capturar os chunks do PDF no buffer
      doc.on("data", buffers.push.bind(buffers))

      // Quando o documento estiver finalizado, resolver a promessa com o buffer
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers)
        resolve(pdfData)
      })

      // Adicionar marca d'água se o relatório não estiver assinado
      if (report.status !== "assinado") {
        addWatermark(doc, report.status)
      }

      // Adicionar cabeçalho
      await addHeader(doc, options.logoPath)

      // Adicionar título do documento
      doc
        .fontSize(17)
        .font(fonts.bold)
        .fillColor(colors.primary)
        .text("RELATÓRIO DE ANÁLISE DE EVIDÊNCIA", { align: "center" })
        .moveDown(0.5)

      // Adicionar informações do caso
      addSectionTitle(doc, "INFORMAÇÕES DO CASO")

      // Criar tabela de informações do caso
      const caseInfo = [
        ["Número do Caso:", forensicCase._id],
        ["Título do Caso:", forensicCase.title],
        ["Status do Caso:", formatStatus(forensicCase.status)],
        ["Data de Abertura:", moment(forensicCase.openDate).format("DD/MM/YYYY")],
      ]

      addTable(doc, caseInfo)
      doc.moveDown()

      // Adicionar informações da evidência
      addSectionTitle(doc, "DETALHES DA EVIDÊNCIA")

      const evidenceInfo = [
        ["ID da Evidência:", evidence._id],
        ["Tipo de Evidência:", evidence.type === "image" ? "Imagem" : "Texto"],
        ["Descrição:", evidence.description || "Sem descrição"],
        ["Data de Coleta:", moment(evidence.collectionDate).format("DD/MM/YYYY")],
        ["Coletado por:", evidence.collectedBy ? evidence.collectedBy.name : "Não especificado"],
      ]

      // Adicionar metadados específicos do tipo de evidência
      if (evidence.type === "image") {
        if (evidence.imageType) {
          evidenceInfo.push(["Tipo de Imagem:", formatImageType(evidence.imageType)])
        }
        if (evidence.cloudinary) {
          evidenceInfo.push(["Dimensões:", `${evidence.cloudinary.width}x${evidence.cloudinary.height} pixels`])
          evidenceInfo.push(["Formato:", evidence.cloudinary.format.toUpperCase()])
        }
      } else if (evidence.type === "text") {
        if (evidence.contentType) {
          evidenceInfo.push(["Tipo de Conteúdo:", formatContentType(evidence.contentType)])
        }
        if (evidence.content) {
          const wordCount = evidence.content.split(/\s+/).length
          evidenceInfo.push(["Contagem de Palavras:", wordCount.toString()])
        }
      }

      addTable(doc, evidenceInfo)
      doc.moveDown()

      // Se for uma evidência de imagem, adicionar a imagem ao relatório
      if (evidence.type === "image" && evidence.imageUrl) {
        try {
          addSectionTitle(doc, "IMAGEM DA EVIDÊNCIA")

          // Calcular dimensões para a imagem no PDF
          const maxWidth = doc.page.width - 100
          const maxHeight = 300

          // Obter dimensões da imagem
          const imgWidth = evidence.cloudinary ? evidence.cloudinary.width : 800
          const imgHeight = evidence.cloudinary ? evidence.cloudinary.height : 600

          // Calcular proporção para redimensionar
          const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight)
          const width = imgWidth * ratio
          const height = imgHeight * ratio

          // Centralizar a imagem
          const x = (doc.page.width - width) / 2

          // Adicionar a imagem
          doc.image(evidence.imageUrl, x, doc.y, { width, height })
          doc.moveDown(2)
        } catch (error) {
          console.error("Erro ao adicionar imagem ao PDF:", error)
          doc.text("Não foi possível carregar a imagem da evidência.", { align: "center" })
          doc.moveDown()
        }
      }

      // Se for uma evidência de texto, adicionar o conteúdo ao relatório
      if (evidence.type === "text" && evidence.content) {
        addSectionTitle(doc, "CONTEÚDO DA EVIDÊNCIA")
        doc
          .fontSize(10)
          .font(fonts.italic)
          .fillColor(colors.text)
          .text(evidence.content, { align: "justify" })
          .moveDown()
      }

      // Adicionar informações do relatório
      addSectionTitle(doc, "DETALHES DO RELATÓRIO")

      const reportInfo = [
        ["Título:", report.title],
        ["Data de Criação:", moment(report.createdAt).format("DD/MM/YYYY")],
        ["Perito Responsável:", expert.name],
        ["Status:", formatStatus(report.status)],
      ]

      if (report.digitalSignature && report.digitalSignature.signatureDate) {
        reportInfo.push(["Assinado em:", moment(report.digitalSignature.signatureDate).format("DD/MM/YYYY HH:mm:ss")])
      }

      addTable(doc, reportInfo)
      doc.moveDown()

      // Adicionar metodologia se existir
      if (report.methodology) {
        addSectionTitle(doc, "METODOLOGIA")
        doc
          .fontSize(11)
          .font(fonts.normal)
          .fillColor(colors.text)
          .text(report.methodology, { align: "justify" })
          .moveDown()
      }

      // Adicionar conteúdo do relatório
      addSectionTitle(doc, "ANÁLISE")
      doc.fontSize(11).font(fonts.normal).fillColor(colors.text).text(report.content, { align: "justify" }).moveDown()

      // Adicionar descobertas
      addSectionTitle(doc, "DESCOBERTAS")
      doc.fontSize(11).font(fonts.normal).fillColor(colors.text).text(report.findings, { align: "justify" }).moveDown()

      // Adicionar conclusão se existir
      if (report.conclusion) {
        addSectionTitle(doc, "CONCLUSÃO")
        doc
          .fontSize(11)
          .font(fonts.normal)
          .fillColor(colors.text)
          .text(report.conclusion, { align: "justify" })
          .moveDown()
      }

      // Adicionar assinatura digital se o relatório estiver assinado
      if (report.status === "assinado" && report.digitalSignature) {
        await addDigitalSignature(doc, report, expert)
      }

      // Adicionar rodapé com assinatura tradicional
      addFooter(doc, expert, report)

      // Finalizar o documento
      doc.end()
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      reject(error)
    }
  })
}

/**
 * Adiciona cabeçalho ao documentodiciona cabeçalho ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {String} logoPath - Caminho para o logo (opcional)
 */
const addHeader = async (doc, logoPath) => {
  // Desenhar retângulo de cabeçalho
  doc.rect(50, 50, doc.page.width - 100, 60).fillAndStroke(colors.light, colors.primary)

  // Adicionar logo se fornecido
  if (logoPath && fs.existsSync(logoPath)) {
    doc.image(logoPath, 60, 55, { width: 50 })
    doc
      .fontSize(14)
      .font(fonts.bold)
      .fillColor(colors.primary)
      .text("SISTEMA DE GESTÃO ODONTOLÓGICA FORENSE", 120, 65)
      .fontSize(10)
      .font(fonts.normal)
      .fillColor(colors.lightText)
      .text("Documento gerado em " + moment().format("DD/MM/YYYY [às] HH:mm"), 120, 85)
  } else {
    // Se não houver logo, centralizar o texto
    doc
      .fontSize(16)
      .font(fonts.bold)
      .fillColor(colors.primary)
      .text("SISTEMA DE GESTÃO ODONTOLÓGICA FORENSE", 50, 65, { align: "center" })
      .fontSize(10)
      .font(fonts.normal)
      .fillColor(colors.lightText)
      .text("Documento gerado em " + moment().format("DD/MM/YYYY [às] HH:mm"), 50, 85, { align: "center" })
  }

  doc.moveDown(3)
}

/**
 * Adiciona título de seção ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {String} title - Título da seção
 */
const addSectionTitle = (doc, title) => {
  doc.fontSize(12).font(fonts.bold).fillColor(colors.primary).text(title).moveDown(0.5)
}

/**
 * Adiciona tabela simples ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {Array} rows - Linhas da tabela (array de arrays)
 */
const addTable = (doc, rows) => {
  const colWidth = [150, 350]
  const rowHeight = 20
  let y = doc.y

  rows.forEach((row, i) => {
    // Alternar cores de fundo para melhor legibilidade
    const fillColor = i % 2 === 0 ? colors.light : "#ffffff"

    doc.rect(50, y, colWidth[0] + colWidth[1], rowHeight).fill(fillColor)

    doc
      .fontSize(10)
      .font(fonts.bold)
      .fillColor(colors.text)
      .text(row[0], 55, y + 5, { width: colWidth[0] - 10 })

    doc
      .fontSize(10)
      .font(fonts.normal)
      .fillColor(colors.text)
      .text(row[1], 55 + colWidth[0], y + 5, { width: colWidth[1] - 10 })

    y += rowHeight
  })

  doc.y = y + 5
}

/**
 * Adiciona assinatura digital ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} report - Relatório
 * @param {Object} expert - Perito responsável
 */
const addDigitalSignature = async (doc, report, expert) => {
  // Criar seção de assinatura digital
  addSectionTitle(doc, "ASSINATURA DIGITAL")

  // Criar caixa de assinatura
  const signatureBoxY = doc.y
  doc.rect(50, signatureBoxY, doc.page.width - 100, 120).fillAndStroke("#f8f9fa", "#dee2e6")

  // Adicionar informações da assinatura
  doc
    .fontSize(10)
    .font(fonts.bold)
    .fillColor(colors.primary)
    .text("Documento assinado digitalmente por:", 60, signatureBoxY + 10)

  doc
    .fontSize(10)
    .font(fonts.normal)
    .fillColor(colors.text)
    .text(`${expert.name} (${expert.email})`, 60, signatureBoxY + 25)
    .text(
      `Data e hora: ${moment(report.digitalSignature.signatureDate).format("DD/MM/YYYY [às] HH:mm:ss")}`,
      60,
      signatureBoxY + 40,
    )

  // Gerar hash do documento para verificação
  const documentHash = crypto
    .createHash("sha256")
    .update(report._id.toString() + report.content + report.digitalSignature.signatureDate)
    .digest("hex")

  // Adicionar hash do documento
  doc
    .fontSize(8)
    .font(fonts.italic)
    .fillColor(colors.lightText)
    .text(`Hash de verificação: ${documentHash}`, 60, signatureBoxY + 55)

  try {
    // Gerar QR code para verificação
    const verificationUrl = `https://perioscan-back-end.onrender.com/api/evidence-reports/verify/${report._id}?hash=${documentHash}`
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl)

    // Adicionar QR code
    doc.image(qrCodeDataUrl, doc.page.width - 150, signatureBoxY + 10, { width: 80 })

    doc
      .fontSize(8)
      .font(fonts.italic)
      .fillColor(colors.lightText)
      .text(
        "Escaneie o QR code para verificar a autenticidade deste documento",
        doc.page.width - 230,
        signatureBoxY + 95,
        { width: 160, align: "center" },
      )
  } catch (error) {
    console.error("Erro ao gerar QR code:", error)
    // Continuar sem o QR code
    doc
      .fontSize(8)
      .font(fonts.italic)
      .fillColor(colors.lightText)
      .text("Não foi possível gerar o QR code para verificação", doc.page.width - 230, signatureBoxY + 50, {
        width: 160,
        align: "center",
      })
  }

  doc.y = signatureBoxY + 130
}

/**
 * Adiciona rodapé ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} expert - Perito responsável
 * @param {Object} report - Relatório
 */
const addFooter = (doc, expert, report) => {
  const pageBottom = doc.page.height - 100

  // Linha de assinatura
  doc
    .fontSize(10)
    .font(fonts.normal)
    .fillColor(colors.text)
    .text("_______________________________", 50, pageBottom, { align: "center" })
    .text(expert.name, 50, pageBottom + 15, { align: "center" })
    .text(`Perito Odontologista - ${expert.email}`, 50, pageBottom + 30, { align: "center" })
}

/**
 * Adiciona marca d'água ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {String} status - Status do documento
 */
const addWatermark = (doc, status) => {
  let text, color

  switch (status) {
    case "rascunho":
      text = "RASCUNHO"
      color = colors.warning
      break
    case "finalizado":
      text = "FINALIZADO - AGUARDANDO ASSINATURA"
      color = colors.secondary
      break
    default:
      text = status.toUpperCase()
      color = colors.lightText
  }

  // Salvar estado atual
  doc.save()

  // Configurar marca d'água
  doc
    .fontSize(60)
    .font(fonts.bold)
    .fillColor(color)
    .fillOpacity(0.3)
    .rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] })
    .text(text, 0, doc.page.height / 2 - 30, { align: "center" })

  // Restaurar estado
  doc.restore()
}

/**
 * Formata o status para exibição
 * @param {String} status - Status do documento
 * @returns {String} - Status formatado
 */
const formatStatus = (status) => {
  switch (status) {
    case "em andamento":
      return "Em Andamento"
    case "finalizado":
      return "Finalizado"
    case "arquivado":
      return "Arquivado"
    case "rascunho":
      return "Rascunho"
    case "assinado":
      return "Assinado"
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

/**
 * Formata o tipo de imagem para exibição
 * @param {String} imageType - Tipo de imagem
 * @returns {String} - Tipo de imagem formatado
 */
const formatImageType = (imageType) => {
  switch (imageType) {
    case "radiografia":
      return "Radiografia"
    case "fotografia":
      return "Fotografia"
    case "odontograma":
      return "Odontograma"
    case "outro":
      return "Outro"
    default:
      return imageType.charAt(0).toUpperCase() + imageType.slice(1)
  }
}

/**
 * Formata o tipo de conteúdo para exibição
 * @param {String} contentType - Tipo de conteúdo
 * @returns {String} - Tipo de conteúdo formatado
 */
const formatContentType = (contentType) => {
  switch (contentType) {
    case "relato":
      return "Relato"
    case "depoimento":
      return "Depoimento"
    case "descrição técnica":
      return "Descrição Técnica"
    case "outro":
      return "Outro"
    default:
      return contentType.charAt(0).toUpperCase() + contentType.slice(1)
  }
}

export default generateEvidenceReportPDF
