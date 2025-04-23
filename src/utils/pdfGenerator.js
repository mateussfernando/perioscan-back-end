import PDFDocument from "pdfkit";
import moment from "moment";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import QRCode from "qrcode";
import crypto from "crypto";
import jwt from "jsonwebtoken"; // Import JWT

// Configurar moment para português do Brasil
moment.locale("pt-br");

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para o documento (paleta profissional em preto, branco e cinza)
const colors = {
  primary: "#000000", // Preto
  secondary: "#333333", // Cinza escuro
  accent: "#666666", // Cinza médio
  light: "#f5f5f5", // Cinza muito claro (quase branco)
  text: "#333333", // Cinza escuro para texto
  lightText: "#666666", // Cinza médio para texto secundário
  success: "#2e7d32", // Verde escuro
  warning: "#f9a825", // Amarelo escuro
  danger: "#c62828", // Vermelho escuro
};

// Fontes personalizadas
const fonts = {
  normal: "Helvetica",
  bold: "Helvetica-Bold",
  italic: "Helvetica-Oblique",
  boldItalic: "Helvetica-BoldOblique",
};

/**
 * Calcula o espaço disponível na página atual
 * @param {PDFDocument} doc - Documento PDF
 * @param {Number} margin - Margem inferior a ser considerada
 * @returns {Number} - Espaço disponível em pontos
 */
const availableSpace = (doc, margin = 50) => {
  return doc.page.height - doc.y - margin;
};

/**
 * Gera um PDF para um laudo pericial
 * @param {Object} report - O laudo a ser convertido em PDF
 * @param {Object} forensicCase - O caso relacionado ao laudo
 * @param {Object} expert - O perito responsável pelo laudo
 * @param {Array} evidences - Lista de evidências anexadas ao laudo
 * @param {Object} options - Opções adicionais para a geração do PDF
 * @returns {Promise<Buffer>} - Buffer contendo o PDF gerado
 */
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
        margin: 50,
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: `Laudo Pericial - ${report.title}`,
          Author: expert.name,
          Subject: "Laudo Pericial Odontológico",
          Keywords: "odontologia legal, laudo, pericial, forense",
          Creator: "Sistema de Gestão Pericial Odontolegal - PerioScan",
          CreationDate: new Date(),
        },
      });

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Definir margens consistentes
      const margin = 50;
      const contentWidth = doc.page.width - margin * 2;

      // Marca d'água (em camada inferior)
      if (report.status !== "assinado") {
        addWatermark(doc, report.status);
      }

      // Cabeçalho
      const headerHeight = await addHeader(doc, options.logoPath, margin);
      let currentY = headerHeight + 20; // Posição Y após o cabeçalho

      // Título principal
      doc
        .fontSize(16)
        .font(fonts.bold)
        .fillColor(colors.primary)
        .text("LAUDO PERICIAL ODONTOLEGAL", margin, currentY, {
          align: "center",
          width: contentWidth,
        });

      currentY = doc.y + 15; // Atualizar posição Y após o título

      // Seção do Caso
      currentY = addSectionTitle(doc, "INFORMAÇÕES DO CASO", margin, currentY);

      const caseInfo = [
        ["Número do Caso:", report.caseNumber || forensicCase._id.toString()],
        ["Título do Caso:", forensicCase.title || "Sem título"],
      ];

      // Adicionar data do ocorrido se disponível
      if (forensicCase.occurrenceDate) {
        caseInfo.push([
          "Data do Ocorrido:",
          moment(forensicCase.occurrenceDate).format("DD/MM/YYYY"),
        ]);
      }

      caseInfo.push(
        ["Status do Caso:", formatStatus(forensicCase.status)],
        [
          "Data de Abertura:",
          moment(forensicCase.openDate).format("DD/MM/YYYY"),
        ]
      );

      currentY = addTable(doc, caseInfo, margin, currentY, contentWidth);
      currentY += 15; // Espaço após a tabela

      // Seção do Relatório
      currentY = addSectionTitle(doc, "DETALHES DO LAUDO", margin, currentY);

      const reportInfo = [
        ["Título:", report.title],
        ["Data de Criação:", moment(report.createdAt).format("DD/MM/YYYY")],
        ["Perito Responsável:", expert.name],
        ["Status:", formatStatus(report.status)],
      ];

      if (report.digitalSignature?.signatureDate) {
        reportInfo.push([
          "Assinado em:",
          moment(report.digitalSignature.signatureDate).format(
            "DD/MM/YYYY HH:mm:ss"
          ),
        ]);
      }

      currentY = addTable(doc, reportInfo, margin, currentY, contentWidth);
      currentY += 15;

      // Verificar se é necessário adicionar uma nova página
      if (availableSpace(doc, 100) < 0) {
        doc.addPage();
        currentY = margin;
      }

      // Metodologia (se existir)
      if (report.methodology) {
        currentY = addSectionTitle(doc, "METODOLOGIA", margin, currentY);

        doc
          .fontSize(11)
          .font(fonts.normal)
          .fillColor(colors.text)
          .text(report.methodology, margin, currentY, {
            align: "justify",
            width: contentWidth,
          });

        currentY = doc.y + 15;
      }

      // Conteúdo do Relatório
      currentY = addSectionTitle(doc, "DESCRIÇÃO", margin, currentY);

      doc
        .fontSize(11)
        .font(fonts.normal)
        .fillColor(colors.text)
        .text(report.content, margin, currentY, {
          align: "justify",
          width: contentWidth,
        });

      currentY = doc.y + 15;

      // Conclusão (se existir)
      if (report.conclusion) {
        currentY = addSectionTitle(doc, "CONCLUSÃO", margin, currentY);

        doc
          .fontSize(11)
          .font(fonts.normal)
          .fillColor(colors.text)
          .text(report.conclusion, margin, currentY, {
            align: "justify",
            width: contentWidth,
          });

        currentY = doc.y + 15;
      }

      // Verificar se é necessário adicionar uma nova página
      if (availableSpace(doc, 100) < 0) {
        doc.addPage();
        currentY = margin;
      }

      // Adicionar lista de evidências anexadas
      if (evidences && evidences.length > 0) {
        currentY = addSectionTitle(
          doc,
          "EVIDÊNCIAS ANEXADAS",
          margin,
          currentY
        );

        // Tabela de evidências
        const tableWidth = contentWidth;
        const colWidths = [
          tableWidth * 0.1,
          tableWidth * 0.5,
          tableWidth * 0.2,
          tableWidth * 0.2,
        ];
        const rowHeight = 25;
        let y = currentY;

        // Cabeçalhos
        doc.rect(margin, y, tableWidth, rowHeight).fill(colors.secondary);

        const headers = ["Nº", "Descrição", "Tipo", "Data de Coleta"];
        let x = margin;
        headers.forEach((header, i) => {
          doc
            .fontSize(10)
            .font(fonts.bold)
            .fillColor("#ffffff")
            .text(header, x + 5, y + 7, { width: colWidths[i] - 10 });

          x += colWidths[i];
        });

        y += rowHeight;

        // Linhas de dados
        evidences.forEach((evidence, rowIndex) => {
          const fillColor = rowIndex % 2 === 0 ? colors.light : "#ffffff";

          doc.rect(margin, y, tableWidth, rowHeight).fill(fillColor);

          let x = margin;
          const row = [
            (rowIndex + 1).toString(),
            evidence.description || "Sem descrição",
            formatEvidenceType(evidence.type),
            evidence.collectionDate
              ? moment(evidence.collectionDate).format("DD/MM/YYYY")
              : "N/A",
          ];

          row.forEach((cell, cellIndex) => {
            doc
              .fontSize(10)
              .font(cellIndex === 0 ? fonts.bold : fonts.normal)
              .fillColor(colors.text)
              .text(cell, x + 5, y + 7, { width: colWidths[cellIndex] - 10 });

            x += colWidths[cellIndex];
          });

          y += rowHeight;
        });

        currentY = y + 15;
      }

      // Assinatura Digital
      if (report.status === "assinado" && report.digitalSignature) {
        currentY = await addDigitalSignature(
          doc,
          report,
          expert,
          margin,
          currentY,
          contentWidth
        );
      }

      // Adicionar rodapé com assinatura
      addFooter(doc, expert, report, margin, contentWidth);

      // Adicionar numeração de páginas
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        // Adicionar numeração de página
        doc
          .fontSize(8)
          .fillColor(colors.lightText)
          .text(
            `Página ${i + 1} de ${totalPages}`,
            margin,
            doc.page.height - 30,
            {
              align: "center",
              width: contentWidth,
            }
          );
      }

      doc.end();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      reject(error);
    }
  });
};

/**
 * Adiciona cabeçalho ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {String} logoPath - Caminho para o logo (opcional)
 * @param {Number} margin - Margem do documento
 * @returns {Number} - Altura final do cabeçalho
 */
// Atualizar o cabeçalho para incluir a hora correta
const addHeader = async (doc, logoPath, margin) => {
  const contentWidth = doc.page.width - margin * 2;
  const headerHeight = 70;

  // Cabeçalho com fundo claro
  doc
    .rect(margin, margin, contentWidth, headerHeight)
    .fillAndStroke(colors.light, colors.primary);

  if (logoPath && fs.existsSync(logoPath)) {
    doc
      .image(logoPath, margin + 10, margin + 10, { width: 50 })
      .fontSize(14)
      .font(fonts.bold)
      .fillColor(colors.primary)
      .text(
        "SISTEMA DE GESTÃO PERICIAL ODONTOLEGAL - PERIOSCAN",
        margin + 70,
        margin + 15,
        {
          width: contentWidth - 80,
        }
      )
      .fontSize(10)
      .text(
        "Documento gerado em " + moment().format("DD/MM/YYYY [às] HH:mm:ss"),
        margin + 70,
        margin + 35,
        {
          width: contentWidth - 80,
        }
      );
  } else {
    doc
      .fontSize(16)
      .font(fonts.bold)
      .fillColor(colors.primary)
      .text(
        "SISTEMA DE GESTÃO PERICIAL ODONTOLEGAL - PERIOSCAN",
        margin,
        margin + 15,
        {
          align: "center",
          width: contentWidth,
        }
      )
      .fontSize(10)
      .text(
        "Documento gerado em " + moment().format("DD/MM/YYYY [às] HH:mm:ss"),
        margin,
        margin + 40,
        {
          align: "center",
          width: contentWidth,
        }
      );
  }

  return margin + headerHeight;
};

/**
 * Adiciona título de seção ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {String} title - Título da seção
 * @param {Number} margin - Margem do documento
 * @param {Number} yPosition - Posição Y atual
 * @returns {Number} - Nova posição Y após o título
 */
const addSectionTitle = (doc, title, margin, yPosition) => {
  doc
    .fontSize(12)
    .font(fonts.bold)
    .fillColor(colors.primary)
    .text(title, margin, yPosition);

  return doc.y + 5;
};

/**
 * Adiciona tabela simples ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {Array} rows - Linhas da tabela (array de arrays)
 * @param {Number} margin - Margem do documento
 * @param {Number} yPosition - Posição Y atual
 * @param {Number} width - Largura da tabela
 * @returns {Number} - Nova posição Y após a tabela
 */
const addTable = (doc, rows, margin, yPosition, width) => {
  const colWidth = [width * 0.3, width * 0.7];
  let y = yPosition;

  rows.forEach((row, index) => {
    // Alternar cores de fundo para melhor legibilidade
    doc
      .rect(margin, y, colWidth[0] + colWidth[1], 20)
      .fill(index % 2 === 0 ? colors.light : "#ffffff");

    // Coluna 1 (label)
    doc
      .fontSize(10)
      .font(fonts.bold)
      .fillColor(colors.text)
      .text(row[0], margin + 5, y + 5, { width: colWidth[0] - 10 });

    // Coluna 2 (valor)
    doc
      .fontSize(10)
      .font(fonts.normal)
      .text(row[1], margin + colWidth[0], y + 5, { width: colWidth[1] - 10 });

    y += 20;
  });

  return y;
};

/**
 * Formata o status para exibição
 * @param {String} status - Status do documento
 * @returns {String} - Status formatado
 */
const formatStatus = (status) => {
  const statusMap = {
    "em andamento": "Em Andamento",
    finalizado: "Finalizado",
    arquivado: "Arquivado",
    rascunho: "Rascunho",
    assinado: "Assinado",
  };
  return statusMap[status] || status;
};

/**
 * Formata o tipo de evidência para exibição
 * @param {String} type - Tipo de evidência
 * @returns {String} - Tipo formatado
 */
const formatEvidenceType = (type) => {
  if (!type) return "Outro";
  switch (type.toLowerCase()) {
    case "image":
      return "Imagem";
    case "text":
      return "Texto";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

/**
 * Adiciona assinatura digital ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} report - Relatório
 * @param {Object} expert - Perito responsável
 * @param {Number} margin - Margem do documento
 * @param {Number} yPosition - Posição Y atual
 * @param {Number} width - Largura do conteúdo
 * @returns {Number} - Nova posição Y após a assinatura
 */
// Atualizar a função de assinatura digital para mostrar o nome de quem assinou
const addDigitalSignature = async (
  doc,
  report,
  expert,
  margin,
  yPosition,
  width
) => {
  // Verificar se é necessário adicionar uma nova página
  if (availableSpace(doc, 150) < 0) {
    doc.addPage();
    yPosition = margin;
  }

  const boxHeight = 120;

  doc
    .rect(margin, yPosition, width, boxHeight)
    .fillAndStroke("#f8f9fa", "#dee2e6");

  // Obter o nome do assinante
  let signerName = expert.name;
  let signerEmail = expert.email;

  // Se tiver informações do assinante na assinatura digital, usar essas informações
  if (report.digitalSignature && report.digitalSignature.signedBy) {
    try {
      // Tentar decodificar o token para obter informações do assinante
      const decodedToken = jwt.verify(
        report.digitalSignature.signatureData,
        process.env.JWT_SECRET
      );
      if (decodedToken && decodedToken.signedBy) {
        signerName = decodedToken.signedBy.name || expert.name;
        signerEmail = decodedToken.signedBy.email || expert.email;
      }
    } catch (error) {
      console.error("Erro ao decodificar assinatura:", error);
      // Manter os valores padrão em caso de erro
    }
  }

  doc
    .fontSize(10)
    .font(fonts.bold)
    .fillColor(colors.primary)
    .text("Documento assinado digitalmente por:", margin + 10, yPosition + 10)
    .font(fonts.normal)
    .text(`${signerName} (${signerEmail})`, margin + 10, yPosition + 25)
    .text(
      `Data e hora: ${moment(report.digitalSignature.signatureDate).format(
        "DD/MM/YYYY [às] HH:mm:ss"
      )}`,
      margin + 10,
      yPosition + 40
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
    .fontSize(8)
    .font(fonts.italic)
    .text(`Hash de verificação: ${documentHash}`, margin + 10, yPosition + 55);

  try {
    const verificationUrl = `${
      process.env.APP_URL || "https://perioscan-back-end.onrender.com"
    }/api/reports/verify/${report._id}?hash=${
      report.digitalSignature.contentHash || documentHash
    }&code=${report.digitalSignature.verificationCode || ""}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    doc
      .image(qrCodeDataUrl, margin + width - 90, yPosition + 10, { width: 80 })
      .fontSize(8)
      .text(
        "Escaneie o QR code para verificar a autenticidade",
        margin + width - 180,
        yPosition + 95,
        {
          width: 160,
          align: "center",
        }
      );
  } catch (error) {
    console.error("Erro ao gerar QR code:", error);
    doc
      .fontSize(8)
      .text(
        "Não foi possível gerar o QR code",
        margin + width - 180,
        yPosition + 50,
        {
          width: 160,
          align: "center",
        }
      );
  }

  return yPosition + boxHeight + 10;
};

/**
 * Adiciona rodapé ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} expert - Perito responsável
 * @param {Object} report - Relatório
 * @param {Number} margin - Margem do documento
 * @param {Number} width - Largura do conteúdo
 */
const addFooter = (doc, expert, report, margin, width) => {
  // Adicionar rodapé apenas na última página atual
  const currentPage = doc.bufferedPageRange().count - 1;
  doc.switchToPage(currentPage);

  // Calcular posição Y para o rodapé (mais próximo do final da página)
  const footerY = doc.page.height - 70;

  doc
    .fontSize(10)
    .text("_______________________________", margin, footerY, {
      align: "center",
      width: width,
    })
    .text(expert.name, margin, doc.y, {
      align: "center",
      width: width,
    })
    .text(`Perito Odontologista - ${expert.email}`, margin, doc.y, {
      align: "center",
      width: width,
    });
};

/**
 * Adiciona marca d'água ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {String} status - Status do documento
 */
const addWatermark = (doc, status) => {
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

  const { text, color } = watermarkConfig[status] || watermarkConfig.default;

  doc
    .save()
    .fontSize(60)
    .font(fonts.bold)
    .fillColor(color)
    .fillOpacity(0.3)
    .rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] })
    .text(text, 0, doc.page.height / 2 - 30, { align: "center" })
    .restore();
};

export default generateReportPDF;
