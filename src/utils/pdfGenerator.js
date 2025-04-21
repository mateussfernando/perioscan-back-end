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
 * Gera um PDF para um laudo pericial
 * @param {Object} report - O laudo a ser convertido em PDF
 * @param {Object} forensicCase - O caso relacionado ao laudo
 * @param {Object} expert - O perito responsável pelo laudo
 * @param {Array} evidences - Lista de evidências anexadas ao laudo
 * @param {Object} options - Opções adicionais para a geração do PDF
 * @returns {Promise<Buffer>} - Buffer contendo o PDF gerado
 */
export const generateReportPDF = async (report, forensicCase, expert, evidences, options = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Criar um buffer para armazenar o PDF
      const buffers = []

      // Criar um novo documento PDF
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Laudo Pericial - ${report.title}`,
          Author: expert.name,
          Subject: "Laudo Pericial Odontológico",
          Keywords: "odontologia legal, laudo, pericial, forense",
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
        .text("LAUDO PERICIAL ODONTOLÓGICO", { align: "center" })
        .moveDown(0.5)

      // Adicionar informações do caso
      addSectionTitle(doc, "INFORMAÇÕES DO CASO")

      // Criar tabela de informações do caso
      const caseInfo = [
        ["Número do Caso:", report.caseNumber || forensicCase._id],
        ["Título:", forensicCase.title],
        ["Data de Abertura:", moment(forensicCase.openDate).format("DD/MM/YYYY")],
      ]

      // Adicionar data do ocorrido se disponível
      if (forensicCase.occurrenceDate) {
        caseInfo.push(["Data do Ocorrido:", moment(forensicCase.occurrenceDate).format("DD/MM/YYYY")])
      }

      caseInfo.push(["Status:", formatStatus(forensicCase.status)])

      addTable(doc, caseInfo)
      doc.moveDown()

      // Adicionar informações do laudo
      addSectionTitle(doc, "DETALHES DO LAUDO")

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

      // Adicionar conteúdo do laudo
      addSectionTitle(doc, "DESCRIÇÃO")
      doc.fontSize(11).font(fonts.normal).fillColor(colors.text).text(report.content, { align: "justify" }).moveDown()

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

      // Adicionar lista de evidências anexadas
      if (evidences && evidences.length > 0) {
        addSectionTitle(doc, "EVIDÊNCIAS ANEXADAS")

        // Tabela de evidências
        const evidenceHeaders = ["Nº", "Descrição", "Tipo", "Data de Coleta"]
        const evidenceRows = evidences.map((evidence, index) => [
          (index + 1).toString(),
          evidence.description || "Sem descrição",
          evidence.type,
          evidence.collectionDate ? moment(evidence.collectionDate).format("DD/MM/YYYY") : "N/A",
        ])

        addTableWithHeaders(doc, evidenceHeaders, evidenceRows)
        doc.moveDown()
      }

      // Adicionar assinatura digital se o relatório estiver assinado
      if (report.status === "assinado" && report.digitalSignature) {
        await addDigitalSignature(doc, report, expert)
      }

      // Adicionar rodapé com assinatura tradicional
      addFooter(doc, expert, report)

      // Adicionar número da página atual
      let pageCount = 1
      doc.on("pageAdded", () => {
        pageCount++
      })

      // Finalizar o documento
      doc.end()
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      reject(error)
    }
  })
}

/**
 * Adiciona cabeçalho ao documento
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
 * Adiciona tabela com cabeçalhos ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {Array} headers - Cabeçalhos da tabela
 * @param {Array} rows - Linhas da tabela (array de arrays)
 */
const addTableWithHeaders = (doc, headers, rows) => {
  // Calcular largura das colunas
  const tableWidth = doc.page.width - 100
  const colWidths = []

  // Definir larguras das colunas (ajustar conforme necessário)
  if (headers.length === 4) {
    colWidths.push(tableWidth * 0.1) // Nº
    colWidths.push(tableWidth * 0.5) // Descrição
    colWidths.push(tableWidth * 0.2) // Tipo
    colWidths.push(tableWidth * 0.2) // Data
  } else {
    // Distribuir igualmente se número de colunas for diferente
    const colWidth = tableWidth / headers.length
    headers.forEach(() => colWidths.push(colWidth))
  }

  const rowHeight = 25
  let y = doc.y

  // Desenhar cabeçalhos
  doc.rect(50, y, tableWidth, rowHeight).fill(colors.primary)

  let x = 50
  headers.forEach((header, i) => {
    doc
      .fontSize(10)
      .font(fonts.bold)
      .fillColor("#ffffff")
      .text(header, x + 5, y + 7, { width: colWidths[i] - 10 })

    x += colWidths[i]
  })

  y += rowHeight

  // Desenhar linhas
  rows.forEach((row, rowIndex) => {
    const fillColor = rowIndex % 2 === 0 ? colors.light : "#ffffff"

    doc.rect(50, y, tableWidth, rowHeight).fill(fillColor)

    let x = 50
    row.forEach((cell, cellIndex) => {
      doc
        .fontSize(10)
        .font(cellIndex === 0 ? fonts.bold : fonts.normal)
        .fillColor(colors.text)
        .text(cell, x + 5, y + 7, { width: colWidths[cellIndex] - 10 })

      x += colWidths[cellIndex]
    })

    y += rowHeight
  })

  doc.y = y + 5
}

/**
 * Adiciona rodapé ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} expert - Perito responsável
 * @param {Object} report - Laudo
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
 * Adiciona assinatura digital ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} report - Laudo
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
    const verificationUrl = `https://perioscan-back-end.onrender.com/api/reports/verify/${report._id}?hash=${documentHash}`
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

export default generateReportPDF
