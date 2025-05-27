import PDFDocument from "pdfkit";
import moment from "moment-timezone";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import QRCode from "qrcode";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import axios from "axios";

// Configuração global
moment.locale("pt-br");
moment.tz.setDefault("America/Sao_Paulo");

// Constantes
const MARGIN = 40;
const FOOTER_HEIGHT = 70;
const PAGE_NUMBER_HEIGHT = 20;
const RESERVED_BOTTOM_SPACE = FOOTER_HEIGHT + PAGE_NUMBER_HEIGHT; // 90

// Cores
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

// Fontes
const fonts = {
  normal: "Helvetica",
  bold: "Helvetica-Bold",
  italic: "Helvetica-Oblique",
  boldItalic: "Helvetica-BoldOblique",
};

// --- Funções Auxiliares ---

function getFormattedDateTime(date) {
  return moment(date || new Date()).format("DD/MM/YYYY [às] HH:mm:ss");
}

function needsNewPage(doc, currentY, requiredHeight) {
  return (
    currentY + requiredHeight > doc.page.height - MARGIN - RESERVED_BOTTOM_SPACE
  );
}

// REMOVIDO: downloadImage não é mais necessário
// async function downloadImage(url) { ... }

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

function formatEvidenceType(type) {
  if (!type) return "Outro";
  switch (type.toLowerCase()) {
    case "image":
      return "Imagem";
    case "text":
      return "Texto";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

// --- Funções de Geração de PDF ---

const addHeader = (doc, logoPath) => {
  const contentWidth = doc.page.width - MARGIN * 2;
  const headerHeight = 60;
  const startY = MARGIN;

  doc
    .rect(MARGIN, startY, contentWidth, headerHeight)
    .fillAndStroke(colors.light, colors.primary);

  const currentDateTime = getFormattedDateTime();

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
    .fillOpacity(0.15)
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
    );

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
    }/api/reports/verify/${report._id}?hash=${
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

export const generateReportPDF = async (
  report,
  forensicCase,
  expert,
  evidences,
  options = {}
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const buffers = [];
      const doc = new PDFDocument({
        size: "A4",
        margin: MARGIN,
        bufferPages: true,
        autoFirstPage: false,
        info: {
          // --- ALTERAÇÃO: Título do PDF agora é o título do caso ---
          Title:
            forensicCase.title || `Laudo Pericial ${report.caseNumber || ""}`,
          // --------------------------------------------------------
          Author: expert.name,
          Subject: "Laudo Pericial Odontológico",
          Keywords: "odontologia legal, laudo, pericial, forense",
          Creator: "Sistema de Gestão Pericial Odontolegal - PerioScan",
          CreationDate: new Date(),
        },
      });

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) =>
        reject(new Error(`Error generating PDF: ${err.message}`))
      );

      let headerBottomY = 0;

      doc.on("pageAdded", () => {
        headerBottomY = addHeader(doc, options.logoPath);
        addWatermark(doc, report.status);
        doc.y = headerBottomY + 10;
      });

      doc.addPage();

      // --- CORREÇÃO: Mover contentWidth para DEPOIS de addPage() ---
      const contentWidth = doc.page.width - MARGIN * 2;

      let currentY = doc.y;

      // Título principal
      doc
        .fontSize(16)
        .font(fonts.bold)
        .fillColor(colors.primary)
        .text("LAUDO PERICIAL ODONTOLEGAL", MARGIN, currentY, {
          align: "center",
          width: contentWidth,
        });
      currentY = doc.y + 10;

      // Seção do Caso
      currentY = addSectionTitle(doc, "INFORMAÇÕES DO CASO", currentY);
      const caseInfo = [
        ["Número do Caso:", report.caseNumber || forensicCase._id.toString()],
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

      // Seção de Vítimas
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

      // Seção do Relatório
      if (needsNewPage(doc, currentY, 120)) {
        doc.addPage();
        currentY = doc.y;
      }
      currentY = addSectionTitle(doc, "DETALHES DO LAUDO", currentY);
      const reportInfo = [
        ["Título:", report.title],
        ["Data de Criação:", moment(report.createdAt).format("DD/MM/YYYY")],
        ["Perito Responsável:", expert.name],
        ["Status:", formatStatus(report.status)],
        ...(report.digitalSignature?.signatureDate
          ? [
              [
                "Assinado em:",
                getFormattedDateTime(report.digitalSignature.signatureDate),
              ],
            ]
          : []),
      ];
      currentY = addTable(doc, reportInfo, currentY, contentWidth);
      currentY += 10;
      doc.y = currentY;

      // Adicionar textos longos
      const addLongTextSection = (title, text) => {
        if (!text) return;
        if (needsNewPage(doc, currentY, 50)) {
          doc.addPage();
          currentY = doc.y;
        }
        currentY = addSectionTitle(doc, title, currentY);
        doc
          .fontSize(11)
          .font(fonts.normal)
          .fillColor(colors.text)
          .text(text, MARGIN, currentY, {
            align: "justify",
            width: contentWidth,
          });
        currentY = doc.y + 10;
      };

      addLongTextSection("METODOLOGIA", report.methodology);
      addLongTextSection("DESCRIÇÃO", report.content);
      addLongTextSection("CONCLUSÃO", report.conclusion);
      doc.y = currentY;

      // --- SEÇÃO DE EVIDÊNCIAS COM APENAS LINKS ---
      if (evidences && evidences.length > 0) {
        if (needsNewPage(doc, currentY, 60)) {
          doc.addPage();
          currentY = doc.y;
        }
        currentY = addSectionTitle(doc, "EVIDÊNCIAS ANEXADAS", currentY);

        const tableWidth = contentWidth;
        const colWidths = [
          tableWidth * 0.1,
          tableWidth * 0.5,
          tableWidth * 0.2,
          tableWidth * 0.2,
        ];
        const rowHeight = 20;
        let y = currentY;
        const headers = ["Nº", "Descrição", "Tipo", "Data de Coleta"];

        const drawEvidenceHeader = () => {
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

        drawEvidenceHeader();

        for (let i = 0; i < evidences.length; i++) {
          const evidence = evidences[i];
          const isImage = evidence.type === "image" && evidence.imageUrl;
          let linkText = "";
          let requiredHeight = rowHeight;

          if (isImage) {
            linkText = `Link da Imagem ${i + 1}: ${evidence.imageUrl}`;
            requiredHeight +=
              doc
                .fontSize(9)
                .heightOfString(linkText, { width: contentWidth - 10 }) + 10;
          }

          if (needsNewPage(doc, y, requiredHeight)) {
            doc.addPage();
            y = doc.y;
            drawEvidenceHeader();
          }

          const fillColor = i % 2 === 0 ? colors.light : "#ffffff";
          doc.rect(MARGIN, y, tableWidth, rowHeight).fill(fillColor);
          let x = MARGIN;
          const row = [
            (i + 1).toString(),
            evidence.description || "Sem descrição",
            formatEvidenceType(evidence.type),
            evidence.collectionDate
              ? moment(evidence.collectionDate).format("DD/MM/YYYY")
              : "N/A",
          ];

          row.forEach((cell, cellIndex) => {
            doc
              .fontSize(9)
              .font(cellIndex === 0 ? fonts.bold : fonts.normal)
              .fillColor(colors.text)
              .text(cell, x + 5, y + 5, { width: colWidths[cellIndex] - 10 });
            x += colWidths[cellIndex];
          });
          y += rowHeight;

          if (isImage) {
            doc
              .fontSize(9)
              .font(fonts.italic)
              .fillColor(colors.accent)
              .text(linkText, MARGIN + 5, y + 5, {
                width: contentWidth - 10,
                link: evidence.imageUrl,
                underline: true,
              });
            y = doc.y;
          }
        }
        currentY = y + 10;
        doc.y = currentY;
      }
      // --- FIM DA SEÇÃO DE EVIDÊNCIAS ---

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

      // --- Finalização: Adicionar Rodapé (última página) e Numeração (todas) ---

      const totalPages = doc.page.count;

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        if (i === totalPages - 1) {
          addFooterContent(doc, expert);
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

export default generateReportPDF;
