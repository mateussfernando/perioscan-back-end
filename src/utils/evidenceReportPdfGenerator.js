import PDFDocument from "pdfkit";
import moment from "moment";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import QRCode from "qrcode";
import crypto from "crypto";

// Configurar moment para português do Brasil
moment.locale("pt-br");

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
};

// Fontes personalizadas
const fonts = {
  normal: "Helvetica",
  bold: "Helvetica-Bold",
  italic: "Helvetica-Oblique",
  boldItalic: "Helvetica-BoldOblique",
};

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
      const buffers = [];
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
      });

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Marca d'água
      if (report.status !== "assinado") {
        addWatermark(doc, report.status);
      }

      // Cabeçalho
      await addHeader(doc, options.logoPath);

      // Título principal
      doc.fontSize(17)
        .font(fonts.bold)
        .fillColor(colors.primary)
        .text("RELATÓRIO DE ANÁLISE DE EVIDÊNCIA", { align: "center" })
        .moveDown(0.5);

      // Seção do Caso
      addSectionTitle(doc, "INFORMAÇÕES DO CASO");
      const caseInfo = [
        ["Número do Caso:", forensicCase._id.toString()],
        ["Título do Caso:", forensicCase.title || "Sem título"],
        ["Status do Caso:", formatStatus(forensicCase.status)],
        ["Data de Abertura:", moment(forensicCase.openDate).format("DD/MM/YYYY")],
      ];
      addTable(doc, caseInfo);
      doc.moveDown();

      // Seção da Evidência
      addSectionTitle(doc, "DETALHES DA EVIDÊNCIA");
      const evidenceInfo = [
        ["ID da Evidência:", evidence._id.toString()],
        ["Tipo de Evidência:", evidence.type === "image" ? "Imagem" : "Texto"],
        ["Descrição:", evidence.description || "Sem descrição"],
        ["Data de Coleta:", moment(evidence.collectionDate).format("DD/MM/YYYY")],
        ["Coletado por:", evidence.collectedBy?.name || "Não especificado"],
      ];

      // Metadados específicos
      if (evidence.type === "image") {
        const imageType = evidence.imageType || "outro";
        const dimensions = evidence.cloudinary 
          ? `${evidence.cloudinary.width}x${evidence.cloudinary.height} pixels`
          : "Dimensões não disponíveis";
        const format = evidence.cloudinary?.format 
          ? evidence.cloudinary.format.toUpperCase() 
          : "Formato não identificado";

        evidenceInfo.push(
          ["Tipo de Imagem:", formatImageType(imageType)],
          ["Dimensões:", dimensions],
          ["Formato:", format]
        );
      } else if (evidence.type === "text") {
        const contentType = evidence.contentType || "outro";
        const wordCount = evidence.content 
          ? evidence.content.split(/\s+/).length 
          : 0;

        evidenceInfo.push(
          ["Tipo de Conteúdo:", formatContentType(contentType)],
          ["Contagem de Palavras:", wordCount.toString()]
        );
      }

      addTable(doc, evidenceInfo);
      doc.moveDown();

      // Conteúdo da Evidência
      if (evidence.type === "image" && evidence.imageUrl) {
        try {
          addSectionTitle(doc, "IMAGEM DA EVIDÊNCIA");
          const maxWidth = doc.page.width - 100;
          const maxHeight = 300;
          const imgWidth = evidence.cloudinary?.width || 800;
          const imgHeight = evidence.cloudinary?.height || 600;
          const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
          
          doc.image(evidence.imageUrl, (doc.page.width - (imgWidth * ratio)) / 2, doc.y, {
            width: imgWidth * ratio,
            height: imgHeight * ratio
          });
          doc.moveDown(2);
        } catch (error) {
          console.error("Erro ao adicionar imagem:", error);
          doc.text("Imagem não disponível", { align: "center" }).moveDown();
        }
      } else if (evidence.type === "text" && evidence.content) {
        addSectionTitle(doc, "CONTEÚDO DA EVIDÊNCIA");
        doc.fontSize(10)
          .font(fonts.italic)
          .fillColor(colors.text)
          .text(evidence.content, { align: "justify" })
          .moveDown();
      }

      // Seção do Relatório
      addSectionTitle(doc, "DETALHES DO RELATÓRIO");
      const reportInfo = [
        ["Título:", report.title],
        ["Data de Criação:", moment(report.createdAt).format("DD/MM/YYYY")],
        ["Perito Responsável:", expert.name],
        ["Status:", formatStatus(report.status)],
      ];

      if (report.digitalSignature?.signatureDate) {
        reportInfo.push(["Assinado em:", 
          moment(report.digitalSignature.signatureDate).format("DD/MM/YYYY HH:mm:ss")
        ]);
      }

      addTable(doc, reportInfo);
      doc.moveDown();

      // Conteúdo do Relatório
      if (report.methodology) {
        addSectionTitle(doc, "METODOLOGIA");
        doc.fontSize(11)
          .font(fonts.normal)
          .fillColor(colors.text)
          .text(report.methodology, { align: "justify" })
          .moveDown();
      }

      addSectionTitle(doc, "ANÁLISE");
      doc.fontSize(11)
        .font(fonts.normal)
        .fillColor(colors.text)
        .text(report.content, { align: "justify" })
        .moveDown();

      addSectionTitle(doc, "DESCOBERTAS");
      doc.fontSize(11)
        .font(fonts.normal)
        .fillColor(colors.text)
        .text(report.findings, { align: "justify" })
        .moveDown();

      if (report.conclusion) {
        addSectionTitle(doc, "CONCLUSÃO");
        doc.fontSize(11)
          .font(fonts.normal)
          .fillColor(colors.text)
          .text(report.conclusion, { align: "justify" })
          .moveDown();
      }

      // Assinatura Digital
      if (report.status === "assinado" && report.digitalSignature) {
        await addDigitalSignature(doc, report, expert);
      }

      addFooter(doc, expert, report);
      doc.end();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      reject(error);
    }
  });
};

// ==============================================
// FUNÇÕES AUXILIARES COMPLETAS
// ==============================================

/**
 * Adiciona cabeçalho ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {String} logoPath - Caminho para o logo (opcional)
 */
const addHeader = async (doc, logoPath) => {
  doc.rect(50, 50, doc.page.width - 100, 60)
     .fillAndStroke(colors.light, colors.primary);

  if (logoPath && fs.existsSync(logoPath)) {
    doc.image(logoPath, 60, 55, { width: 50 })
       .fontSize(14)
       .font(fonts.bold)
       .fillColor(colors.primary)
       .text("SISTEMA DE GESTÃO ODONTOLÓGICA FORENSE", 120, 65)
       .fontSize(10)
       .text("Documento gerado em " + moment().format("DD/MM/YYYY [às] HH:mm"), 120, 85);
  } else {
    doc.fontSize(16)
       .font(fonts.bold)
       .fillColor(colors.primary)
       .text("SISTEMA DE GESTÃO ODONTOLÓGICA FORENSE", { align: "center" })
       .moveDown(0.5)
       .fontSize(10)
       .text("Documento gerado em " + moment().format("DD/MM/YYYY [às] HH:mm"), { align: "center" });
  }
  doc.moveDown(3);
};

/**
 * Adiciona título de seção ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {String} title - Título da seção
 */
const addSectionTitle = (doc, title) => {
  doc.fontSize(12)
     .font(fonts.bold)
     .fillColor(colors.primary)
     .text(title)
     .moveDown(0.5);
};

/**
 * Adiciona tabela simples ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {Array} rows - Linhas da tabela (array de arrays)
 */
const addTable = (doc, rows) => {
  const colWidth = [150, 350];
  let y = doc.y;

  rows.forEach((row, index) => {
    doc.rect(50, y, colWidth[0] + colWidth[1], 20)
       .fill(index % 2 === 0 ? colors.light : "#ffffff");

    doc.fontSize(10)
       .font(fonts.bold)
       .fillColor(colors.text)
       .text(row[0], 55, y + 5, { width: colWidth[0] - 10 });

    doc.fontSize(10)
       .font(fonts.normal)
       .text(row[1], 55 + colWidth[0], y + 5, { width: colWidth[1] - 10 });

    y += 20;
  });
  doc.y = y + 5;
};

/**
 * Formata o status para exibição
 * @param {String} status - Status do documento
 * @returns {String} - Status formatado
 */
const formatStatus = (status) => {
  const statusMap = {
    "em andamento": "Em Andamento",
    "finalizado": "Finalizado",
    "arquivado": "Arquivado",
    "rascunho": "Rascunho",
    "assinado": "Assinado"
  };
  return statusMap[status] || status;
};

/**
 * Formata o tipo de imagem para exibição
 * @param {String} imageType - Tipo de imagem
 * @returns {String} - Tipo de imagem formatado
 */
const formatImageType = (imageType) => {
  if (!imageType) return "Outro";
  switch (imageType.toLowerCase().trim()) {
    case "radiografia": return "Radiografia";
    case "fotografia": return "Fotografia";
    case "odontograma": return "Odontograma";
    default: return "Outro";
  }
};

/**
 * Formata o tipo de conteúdo para exibição
 * @param {String} contentType - Tipo de conteúdo
 * @returns {String} - Tipo de conteúdo formatado
 */
const formatContentType = (contentType) => {
  if (!contentType) return "Outro";
  const type = contentType.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  switch (type) {
    case "relato": return "Relato";
    case "depoimento": return "Depoimento";
    case "descricao tecnica": return "Descrição Técnica";
    default: return "Outro";
  }
};

/**
 * Adiciona assinatura digital ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} report - Relatório
 * @param {Object} expert - Perito responsável
 */
const addDigitalSignature = async (doc, report, expert) => {
  const signatureBoxY = doc.y;
  doc.rect(50, signatureBoxY, doc.page.width - 100, 120)
     .fillAndStroke("#f8f9fa", "#dee2e6");

  doc.fontSize(10)
     .font(fonts.bold)
     .fillColor(colors.primary)
     .text("Documento assinado digitalmente por:", 60, signatureBoxY + 10)
     .font(fonts.normal)
     .text(`${expert.name} (${expert.email})`, 60, signatureBoxY + 25)
     .text(`Data e hora: ${moment(report.digitalSignature.signatureDate).format("DD/MM/YYYY [às] HH:mm:ss")}`, 
           60, signatureBoxY + 40);

  const documentHash = crypto
    .createHash("sha256")
    .update(report._id.toString() + report.content + report.digitalSignature.signatureDate)
    .digest("hex");

  doc.fontSize(8)
     .font(fonts.italic)
     .text(`Hash de verificação: ${documentHash}`, 60, signatureBoxY + 55);

  try {
    const verificationUrl = `${process.env.APP_URL || "https://perioscan-back-end.onrender.com"}/api/evidence-reports/verify/${report._id}?hash=${documentHash}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);
    doc.image(qrCodeDataUrl, doc.page.width - 150, signatureBoxY + 10, { width: 80 })
       .fontSize(8)
       .text("Escaneie o QR code para verificar a autenticidade", 
             doc.page.width - 230, signatureBoxY + 95, { width: 160, align: "center" });
  } catch (error) {
    console.error("Erro ao gerar QR code:", error);
    doc.fontSize(8)
       .text("Não foi possível gerar o QR code", 
             doc.page.width - 230, signatureBoxY + 50, { width: 160, align: "center" });
  }

  doc.y = signatureBoxY + 130;
};

/**
 * Adiciona rodapé ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} expert - Perito responsável
 * @param {Object} report - Relatório
 */
const addFooter = (doc, expert, report) => {
  const pageBottom = doc.page.height - 100;
  doc.fontSize(10)
     .text("_______________________________", { align: "center" })
     .text(expert.name, { align: "center" })
     .text(`Perito Odontologista - ${expert.email}`, { align: "center" });
};

/**
 * Adiciona marca d'água ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {String} status - Status do documento
 */
const addWatermark = (doc, status) => {
  const watermarkConfig = {
    "rascunho": { text: "RASCUNHO", color: colors.warning },
    "finalizado": { text: "FINALIZADO - AGUARDANDO ASSINATURA", color: colors.secondary },
    "default": { text: status?.toUpperCase() || "DOCUMENTO", color: colors.lightText }
  };

  const { text, color } = watermarkConfig[status] || watermarkConfig.default;

  doc.save()
     .fontSize(60)
     .font(fonts.bold)
     .fillColor(color)
     .fillOpacity(0.3)
     .rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] })
     .text(text, 0, doc.page.height / 2 - 30, { align: "center" })
     .restore();
};

export default generateEvidenceReportPDF;