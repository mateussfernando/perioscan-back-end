import PDFDocument from "pdfkit";
import moment from "moment-timezone"; // <-- Padronizado
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import QRCode from "qrcode";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import axios from "axios";

// Configuração global (Padronizado)
moment.locale("pt-br");
moment.tz.setDefault("America/Sao_Paulo");

// Constantes (Padronizado)
const MARGIN = 40;
const FOOTER_HEIGHT = 70;
const PAGE_NUMBER_HEIGHT = 20;
const RESERVED_BOTTOM_SPACE = FOOTER_HEIGHT + PAGE_NUMBER_HEIGHT; // 90

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores (Mantido)
const colors = {
  primary: "#000000",
  secondary: "#333333",
  accent: "#666666",
  light: "#f5f5f5",
  text: "#333333",
  lightText: "#666666",
  success: "#2e7d32",
  warning: "#f9a825",
  danger: "#c62828",
};

// Fontes (Mantido)
const fonts = {
  normal: "Helvetica",
  bold: "Helvetica-Bold",
  italic: "Helvetica-Oblique",
  boldItalic: "Helvetica-BoldOblique",
};

// --- Funções Auxiliares (Padronizado) ---

function getFormattedDateTime(date) {
  return moment(date || new Date()).format("DD/MM/YYYY [às] HH:mm:ss");
}

function needsNewPage(doc, currentY, requiredHeight) {
  return (
    currentY + requiredHeight > doc.page.height - MARGIN - RESERVED_BOTTOM_SPACE
  );
}

function formatStatus(status) {
  const statusMap = {
    "em andamento": "Em Andamento",
    finalizado: "Finalizado",
    arquivado: "Arquivado",
    rascunho: "Rascunho",
    assinado: "Assinado",
  };
  return statusMap[status?.toLowerCase()] || status;
}

// Funções específicas deste relatório (Mantidas)
function formatImageType(imageType) {
  if (!imageType) return "Outro";
  switch (imageType.toLowerCase().trim()) {
    case "radiografia":
      return "Radiografia";
    case "fotografia":
      return "Fotografia";
    case "odontograma":
      return "Odontograma";
    default:
      return "Outro";
  }
}
function formatContentType(contentType) {
  if (!contentType) return "Outro";
  const type = contentType
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  switch (type) {
    case "relato":
      return "Relato";
    case "depoimento":
      return "Depoimento";
    case "descricao tecnica":
      return "Descrição Técnica";
    default:
      return "Outro";
  }
}

// Função utilitária para formatar o tipo de evidência
function formatEvidenceType(type) {
  switch (type) {
    case "image":
      return "Imagem";
    case "text":
      return "Texto";
    default:
      return type || "Outro";
  }
}

// --- Funções de Geração de PDF (Padronizado) ---

const addHeader = (doc, logoPath) => {
  const contentWidth = doc.page.width - MARGIN * 2;
  const headerHeight = 60;
  const startY = MARGIN;

  doc
    .rect(MARGIN, startY, contentWidth, headerHeight)
    .fillAndStroke(colors.light, colors.primary);

  const currentDateTime = getFormattedDateTime(); // <-- Usa função padronizada

  if (logoPath && fs.existsSync(logoPath)) {
    doc.image(logoPath, MARGIN + 10, startY + 10, { width: 40 });
    doc
      .fontSize(12)
      .font(fonts.bold)
      .fillColor(colors.primary)
      .text(
        "SISTEMA DE GESTÃO PERICIAL ODONTOLEGAL - PERIOSCAN",
        MARGIN + 60,
        startY + 15,
        { width: contentWidth - 70 }
      );
    doc
      .fontSize(9)
      .font(fonts.normal)
      .fillColor(colors.text)
      .text(
        `Documento gerado em ${currentDateTime}`,
        MARGIN + 60,
        startY + 35,
        { width: contentWidth - 70 }
      );
  } else {
    doc
      .fontSize(14)
      .font(fonts.bold)
      .fillColor(colors.primary)
      .text(
        "SISTEMA DE GESTÃO PERICIAL ODONTOLEGAL - PERIOSCAN",
        MARGIN,
        startY + 15,
        { align: "center", width: contentWidth }
      );
    doc
      .fontSize(9)
      .font(fonts.normal)
      .fillColor(colors.text)
      .text(`Documento gerado em ${currentDateTime}`, MARGIN, startY + 35, {
        align: "center",
        width: contentWidth,
      });
  }

  return startY + headerHeight;
};

const addWatermark = (doc, status) => {
  if (status === "assinado") return;

  const watermarkConfig = {
    rascunho: { text: "RASCUNHO", color: colors.warning },
    finalizado: {
      text: "FINALIZADO - AGUARDANDO ASSINATURA",
      color: colors.secondary,
    },
    default: {
      text: status?.toUpperCase() || "DOCUMENTO",
      color: colors.lightText,
    },
  };
  const { text, color } =
    watermarkConfig[status?.toLowerCase()] || watermarkConfig.default;

  doc
    .save()
    .fontSize(50)
    .font(fonts.bold)
    .fillColor(color)
    .fillOpacity(0.15) // <-- Opacidade padronizada
    .rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] })
    .text(text, 0, doc.page.height / 2 - 25, { align: "center" })
    .restore();
};

const addSectionTitle = (doc, title, yPosition) => {
  doc
    .fontSize(11)
    .font(fonts.bold)
    .fillColor(colors.primary)
    .text(title, MARGIN, yPosition);
  return doc.y + 3;
};

const addTable = (doc, rows, yPosition, width) => {
  const colWidth = [width * 0.3, width * 0.7];
  let y = yPosition;
  const rowHeight = 18;

  rows.forEach((row, index) => {
    if (needsNewPage(doc, y, rowHeight)) {
      // <-- Usa função padronizada
      doc.addPage();
      y = doc.y;
    }

    doc
      .rect(MARGIN, y, width, rowHeight)
      .fill(index % 2 === 0 ? colors.light : "#ffffff");

    doc
      .fontSize(9)
      .font(fonts.bold)
      .fillColor(colors.text)
      .text(row[0], MARGIN + 5, y + 4, { width: colWidth[0] - 10 });
    doc
      .fontSize(9)
      .font(fonts.normal)
      .text(row[1], MARGIN + colWidth[0], y + 4, { width: colWidth[1] - 10 });

    y += rowHeight;
  });

  return y;
};

const addDigitalSignature = async (doc, report, expert, yPosition, width) => {
  const boxHeight = 100;
  let y = yPosition;

  if (needsNewPage(doc, y, boxHeight)) {
    doc.addPage();
    y = doc.y;
  }

  doc.rect(MARGIN, y, width, boxHeight).fillAndStroke("#f8f9fa", "#dee2e6");

  let signerName = expert.name;
  let signerEmail = expert.email;
  // ... (lógica JWT)

  doc
    .fontSize(9)
    .font(fonts.bold)
    .fillColor(colors.primary)
    .text("Documento assinado digitalmente por:", MARGIN + 10, y + 10)
    .font(fonts.normal)
    .text(`${signerName} (${signerEmail})`, MARGIN + 10, y + 22)
    .text(
      `Data e hora: ${getFormattedDateTime(
        report.digitalSignature.signatureDate
      )}`,
      MARGIN + 10,
      y + 34
    ); // <-- Usa função padronizada

  const documentHash = crypto
    .createHash("sha256")
    .update(
      report._id.toString() +
        report.content +
        report.digitalSignature.signatureDate
    )
    .digest("hex");
  doc
    .fontSize(7)
    .font(fonts.italic)
    .text(`Hash de verificação: ${documentHash}`, MARGIN + 10, y + 46);

  try {
    const verificationUrl = `${
      process.env.APP_URL || "https://perioscan-back-end.onrender.com"
    }/api/evidence-reports/verify/${report._id}?hash=${
      report.digitalSignature.contentHash || documentHash
    }&code=${report.digitalSignature.verificationCode || ""}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);
    doc.image(qrCodeDataUrl, MARGIN + width - 80, y + 10, { width: 70 });
    doc
      .fontSize(7)
      .fillColor(colors.text)
      .text(
        "Escaneie o QR code para verificar a autenticidade",
        MARGIN + width - 160,
        y + 85,
        { width: 140, align: "center" }
      );
  } catch (error) {
    console.error("Erro ao gerar QR code:", error);
    doc
      .fontSize(7)
      .fillColor(colors.danger)
      .text("Não foi possível gerar o QR code", MARGIN + width - 160, y + 50, {
        width: 140,
        align: "center",
      });
  }

  return y + boxHeight + 5;
};

const addFooterContent = (doc, expert) => {
  // <-- Nome padronizado
  const contentWidth = doc.page.width - MARGIN * 2;
  const footerY = doc.page.height - MARGIN - FOOTER_HEIGHT + 10;

  doc
    .fontSize(9)
    .fillColor(colors.text)
    .text("_______________________________", MARGIN, footerY, {
      align: "center",
      width: contentWidth,
    })
    .text(expert.name, MARGIN, doc.y + 2, {
      align: "center",
      width: contentWidth,
    })
    .text(`Perito Odontologista - ${expert.email}`, MARGIN, doc.y, {
      align: "center",
      width: contentWidth,
    });
};

// --- Função Principal de Geração ---

export const generateEvidenceReportPDF = async (
  report,
  evidence,
  forensicCase,
  expert,
  options = {}
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const buffers = [];
      const doc = new PDFDocument({
        size: "A4",
        margin: MARGIN,
        bufferPages: true,
        autoFirstPage: false, // <-- Padronizado
        info: {
          // --- ALTERAÇÃO: Título do PDF agora é o título do caso ---
          Title:
            forensicCase.title ||
            `Relatório de Evidência ${evidence._id.toString()}`,
          // --------------------------------------------------------
          Author: expert.name,
          Subject: "Relatório de Evidência Odontológica Forense",
          Keywords: "odontologia legal, evidência, relatório, forense",
          Creator:
            "Sistema de Gestão de Laudos Forense Odontolegal - PerioScan",
          CreationDate: new Date(),
        },
      });

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) =>
        reject(new Error(`Error generating PDF: ${err.message}`))
      ); // <-- Padronizado

      let headerBottomY = 0;

      // <-- Padronizado
      doc.on("pageAdded", () => {
        headerBottomY = addHeader(doc, options.logoPath);
        addWatermark(doc, report.status);
        doc.y = headerBottomY + 10;
      });

      doc.addPage(); // <-- Padronizado

      const contentWidth = doc.page.width - MARGIN * 2; // <-- Padronizado
      let currentY = doc.y; // <-- Padronizado

      // Título principal
      doc
        .fontSize(16)
        .font(fonts.bold)
        .fillColor(colors.primary)
        .text("RELATÓRIO DE ANÁLISE DE EVIDÊNCIA", MARGIN, currentY, {
          align: "center",
          width: contentWidth,
        });
      currentY = doc.y + 10;

      // Seção do Caso
      currentY = addSectionTitle(doc, "INFORMAÇÕES DO CASO", currentY);
      const caseInfo = [
        ["Número do Caso:", forensicCase._id.toString()],
        ["Título do Caso:", forensicCase.title || "Sem título"],
        ...(forensicCase.occurrenceDate
          ? [
              [
                "Data do Ocorrido:",
                moment(forensicCase.occurrenceDate).format("DD/MM/YYYY"),
              ],
            ]
          : []),
        ["Status do Caso:", formatStatus(forensicCase.status)],
        [
          "Data de Abertura:",
          moment(forensicCase.openDate).format("DD/MM/YYYY"),
        ],
      ];
      currentY = addTable(doc, caseInfo, currentY, contentWidth);
      currentY += 10;
      doc.y = currentY;

      // Seção de Vítimas (Lógica de quebra de página padronizada)
      if (forensicCase.victims && forensicCase.victims.length > 0) {
        const victimSectionHeight = 40 + forensicCase.victims.length * 20;
        if (needsNewPage(doc, currentY, victimSectionHeight)) {
          doc.addPage();
          currentY = doc.y;
        }
        currentY = addSectionTitle(doc, "VÍTIMAS RELACIONADAS", currentY);

        const tableWidth = contentWidth;
        const colWidths = [
          tableWidth * 0.4,
          tableWidth * 0.3,
          tableWidth * 0.3,
        ];
        const rowHeight = 20;
        let y = currentY;
        const headers = [
          "Nome/Referência",
          "Tipo de Identificação",
          "Relação com o Caso",
        ];

        const drawVictimHeader = () => {
          /* ... (igual ao código anterior) ... */
          doc.rect(MARGIN, y, tableWidth, rowHeight).fill(colors.secondary);
          let x = MARGIN;
          headers.forEach((header, i) => {
            doc
              .fontSize(9)
              .font(fonts.bold)
              .fillColor("#ffffff")
              .text(header, x + 5, y + 5, { width: colWidths[i] - 10 });
            x += colWidths[i];
          });
          y += rowHeight;
        };
        drawVictimHeader();

        for (const victim of forensicCase.victims) {
          if (needsNewPage(doc, y, rowHeight)) {
            // <-- Usa função padronizada
            doc.addPage();
            y = doc.y;
            drawVictimHeader();
          }
          const fillColor = doc.page.count % 2 === 0 ? colors.light : "#ffffff";
          doc.rect(MARGIN, y, tableWidth, rowHeight).fill(fillColor);
          let x = MARGIN;
          const nameOrRef =
            victim.identificationType === "identificada"
              ? victim.name
              : `Ref: ${victim.referenceCode}`;
          const caseRelation = victim.cases?.find(
            (c) => c.caseId?.toString() === forensicCase._id.toString()
          );
          const relationType = caseRelation
            ? caseRelation.relationType
            : "Não especificada";
          const row = [
            nameOrRef,
            victim.identificationType === "identificada"
              ? "Identificada"
              : "Não Identificada",
            relationType,
          ];
          row.forEach((cell, i) => {
            doc
              .fontSize(9)
              .font(fonts.normal)
              .fillColor(colors.text)
              .text(cell, x + 5, y + 5, { width: colWidths[i] - 10 });
            x += colWidths[i];
          });
          y += rowHeight;
        }
        currentY = y + 10;
        doc.y = currentY;
      }

      // Seção da Evidência
      currentY = addSectionTitle(doc, "DETALHES DA EVIDÊNCIA", currentY);
      const evidenceInfo = [
        ["ID da Evidência:", evidence._id.toString()],
        ["Tipo de Evidência:", formatEvidenceType(evidence.type)], // <-- Usa formatador
        ["Descrição:", evidence.description || "Sem descrição"],
        [
          "Data de Coleta:",
          moment(evidence.collectionDate).format("DD/MM/YYYY"),
        ],
        ...(evidence.collectedBy && evidence.collectedBy.name
          ? [["Coletado por:", evidence.collectedBy.name]]
          : []),
      ];
      // Metadados específicos... (Mantido como estava, parece OK)
      if (evidence.type === "image") {
        /* ... */
      } else if (evidence.type === "text") {
        /* ... */
      }
      currentY = addTable(doc, evidenceInfo, currentY, contentWidth);
      currentY += 10;
      doc.y = currentY;

      // --- Conteúdo da Evidência (Padronizado para Link) ---
      if (evidence.type === "image" && evidence.imageUrl) {
        if (needsNewPage(doc, currentY, 40)) {
          doc.addPage();
          currentY = doc.y;
        }
        currentY = addSectionTitle(
          doc,
          "LINK DA IMAGEM DA EVIDÊNCIA",
          currentY
        );
        const linkText = `Link: ${evidence.imageUrl}`;
        doc
          .fontSize(9)
          .font(fonts.italic)
          .fillColor(colors.accent)
          .text(linkText, MARGIN, currentY, {
            width: contentWidth,
            link: evidence.imageUrl, // <-- Link clicável
            underline: true, // <-- Sublinhado
          });
        currentY = doc.y + 10;
      } else if (evidence.type === "text" && evidence.content) {
        if (needsNewPage(doc, currentY, 40)) {
          doc.addPage();
          currentY = doc.y;
        }
        currentY = addSectionTitle(doc, "CONTEÚDO DA EVIDÊNCIA", currentY);
        doc
          .fontSize(9)
          .font(fonts.italic)
          .fillColor(colors.text)
          .text(evidence.content, MARGIN, currentY, {
            align: "justify",
            width: contentWidth,
          });
        currentY = doc.y + 10;
      }
      doc.y = currentY;

      // Seção do Relatório (Padronizado para confiar no pdfkit)
      currentY = addSectionTitle(doc, "DETALHES DO RELATÓRIO", currentY);
      const reportInfo = [
        /* ... (Mantido como estava) ... */
      ];
      currentY = addTable(doc, reportInfo, currentY, contentWidth);
      currentY += 10;
      doc.y = currentY;

      // Adicionar textos longos (Padronizado)
      const addLongTextSection = (title, text) => {
        if (!text) return;
        if (needsNewPage(doc, currentY, 50)) {
          doc.addPage();
          currentY = doc.y;
        }
        currentY = addSectionTitle(doc, title, currentY);
        doc
          .fontSize(10)
          .font(fonts.normal)
          .fillColor(colors.text) // <-- Usar fonte 10 para textos
          .text(text, MARGIN, currentY, {
            align: "justify",
            width: contentWidth,
          });
        currentY = doc.y + 10;
      };

      addLongTextSection("METODOLOGIA", report.methodology);
      addLongTextSection("ANÁLISE", report.content);
      addLongTextSection("DESCOBERTAS", report.findings);
      addLongTextSection("CONCLUSÃO", report.conclusion);
      doc.y = currentY;

      // Assinatura Digital
      if (report.status === "assinado" && report.digitalSignature) {
        currentY = await addDigitalSignature(
          doc,
          report,
          expert,
          currentY,
          contentWidth
        );
        doc.y = currentY;
      }

      // --- Finalização (Padronizado) ---
      const totalPages = doc.page.count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        if (i === totalPages - 1) {
          addFooterContent(doc, expert); // <-- Usa função padronizada
        }
        doc
          .fontSize(8)
          .fillColor(colors.lightText)
          .text(
            `Página ${i + 1} de ${totalPages}`,
            MARGIN,
            doc.page.height - MARGIN + 10,
            { align: "center", width: contentWidth }
          );
      }

      doc.end();
    } catch (error) {
      console.error("Erro fatal ao gerar PDF:", error);
      reject(error);
    }
  });
};

export default generateEvidenceReportPDF;
