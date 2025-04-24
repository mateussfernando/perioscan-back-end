import PDFDocument from "pdfkit";
import moment from "moment-timezone"; 
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import QRCode from "qrcode";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import axios from "axios";

// Configuração global no início do arquivo
moment.locale("pt-br");
moment.tz.setDefault("America/Sao_Paulo");

// Função auxiliar para obter data/hora formatada consistentemente
function getFormattedDateTime(date) {
  return moment(date || new Date()).format("DD/MM/YYYY [às] HH:mm:ss");
}

// Função auxiliar para verificar espaço disponível
function needsNewPage(doc, currentY, requiredHeight, margin) {
  return currentY + requiredHeight > doc.page.height - margin;
}

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
        margin: 40,
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
      const margin = 40;
      const contentWidth = doc.page.width - margin * 2;
      const footerHeight = 70; // Definição da altura do rodapé

      // Marca d'água (em camada inferior)
      if (report.status !== "assinado") {
        addWatermark(doc, report.status);
      }

      // Cabeçalho
      const headerHeight = await addHeader(doc, options.logoPath, margin);
      let currentY = headerHeight + 10;

      // Título principal
      doc
        .fontSize(16)
        .font(fonts.bold)
        .fillColor(colors.primary)
        .text("LAUDO PERICIAL ODONTOLEGAL", margin, currentY, {
          align: "center",
          width: contentWidth,
        });

      currentY = doc.y + 10;

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
      currentY += 10;

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
          getFormattedDateTime(report.digitalSignature.signatureDate),
        ]);
      }

      currentY = addTable(doc, reportInfo, margin, currentY, contentWidth);
      currentY += 10;

      // Verificar espaço disponível e adicionar nova página se necessário
      if (needsNewPage(doc, currentY, 100, margin)) {
        doc.addPage();
        currentY = margin;
      }

      // Metodologia (se existir)
      if (report.methodology) {
        currentY = addSectionTitle(doc, "METODOLOGIA", margin, currentY);

        // Calcular altura do texto antes de adicioná-lo
        const methodologyHeight = doc.heightOfString(report.methodology, {
          width: contentWidth,
          align: "justify",
        });

        // Verificar se há espaço suficiente
        if (needsNewPage(doc, currentY, methodologyHeight + 20, margin)) {
          doc.addPage();
          currentY = margin;
          currentY = addSectionTitle(doc, "METODOLOGIA", margin, currentY);
        }

        doc
          .fontSize(11)
          .font(fonts.normal)
          .fillColor(colors.text)
          .text(report.methodology, margin, currentY, {
            align: "justify",
            width: contentWidth,
          });

        currentY = doc.y + 10;
      }

      // Verificar espaço disponível novamente
      if (needsNewPage(doc, currentY, 100, margin)) {
        doc.addPage();
        currentY = margin;
      }

      // Conteúdo do Relatório
      currentY = addSectionTitle(doc, "DESCRIÇÃO", margin, currentY);

      // Calcular altura do texto antes de adicioná-lo
      const contentHeight = doc.heightOfString(report.content, {
        width: contentWidth,
        align: "justify",
      });

      // Verificar se há espaço suficiente
      if (needsNewPage(doc, currentY, contentHeight + 20, margin)) {
        doc.addPage();
        currentY = margin;
        currentY = addSectionTitle(doc, "DESCRIÇÃO", margin, currentY);
      }

      doc
        .fontSize(11)
        .font(fonts.normal)
        .fillColor(colors.text)
        .text(report.content, margin, currentY, {
          align: "justify",
          width: contentWidth,
        });

      currentY = doc.y + 10;

      // Conclusão (se existir)
      if (report.conclusion) {
        // Verificar espaço disponível novamente
        if (needsNewPage(doc, currentY, 100, margin)) {
          doc.addPage();
          currentY = margin;
        }

        currentY = addSectionTitle(doc, "CONCLUSÃO", margin, currentY);

        // Calcular altura do texto antes de adicioná-lo
        const conclusionHeight = doc.heightOfString(report.conclusion, {
          width: contentWidth,
          align: "justify",
        });

        // Verificar se há espaço suficiente
        if (needsNewPage(doc, currentY, conclusionHeight + 20, margin)) {
          doc.addPage();
          currentY = margin;
          currentY = addSectionTitle(doc, "CONCLUSÃO", margin, currentY);
        }

        doc
          .fontSize(11)
          .font(fonts.normal)
          .fillColor(colors.text)
          .text(report.conclusion, margin, currentY, {
            align: "justify",
            width: contentWidth,
          });

        currentY = doc.y + 10;
      }

      // Adicionar lista de evidências anexadas
      if (evidences && evidences.length > 0) {
        // Verificar espaço disponível novamente
        if (needsNewPage(doc, currentY, 100, margin)) {
          doc.addPage();
          currentY = margin;
        }

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
        const rowHeight = 20;
        let y = currentY;

        // Cabeçalhos
        doc.rect(margin, y, tableWidth, rowHeight).fill(colors.secondary);

        const headers = ["Nº", "Descrição", "Tipo", "Data de Coleta"];
        let x = margin;
        headers.forEach((header, i) => {
          doc
            .fontSize(9)
            .font(fonts.bold)
            .fillColor("#ffffff")
            .text(header, x + 5, y + 5, { width: colWidths[i] - 10 });

          x += colWidths[i];
        });

        y += rowHeight;

        // Linhas de dados
        for (let rowIndex = 0; rowIndex < evidences.length; rowIndex++) {
          const evidence = evidences[rowIndex];
          const fillColor = rowIndex % 2 === 0 ? colors.light : "#ffffff";

          // Verificar se há espaço suficiente para a linha e cabeçalho na página atual
          if (needsNewPage(doc, y, rowHeight, margin)) {
            doc.addPage();
            y = margin;

            // Recriar cabeçalho da tabela na nova página
            doc.rect(margin, y, tableWidth, rowHeight).fill(colors.secondary);

            let x = margin;
            headers.forEach((header, i) => {
              doc
                .fontSize(9)
                .font(fonts.bold)
                .fillColor("#ffffff")
                .text(header, x + 5, y + 5, { width: colWidths[i] - 10 });

              x += colWidths[i];
            });

            y += rowHeight;
          }

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
              .fontSize(9)
              .font(cellIndex === 0 ? fonts.bold : fonts.normal)
              .fillColor(colors.text)
              .text(cell, x + 5, y + 5, { width: colWidths[cellIndex] - 10 });

            x += colWidths[cellIndex];
          });

          y += rowHeight;

          // Se for uma imagem, adicionar a imagem abaixo da linha da tabela
          if (evidence.type === "image" && evidence.imageUrl) {
            try {
              // Adicionar título da imagem
              const titleText = `Imagem ${rowIndex + 1}: ${
                evidence.description || "Sem descrição"
              }`;

              const titleHeight = doc.heightOfString(titleText, {
                width: contentWidth,
              });

              // Estimar altura total necessária (título + imagem + espaço)
              const estimatedImgHeight = 150; // Altura estimada para imagem + legenda
              const totalImageHeight = titleHeight + estimatedImgHeight + 15;

              // Verificar se há espaço suficiente
              if (needsNewPage(doc, y, totalImageHeight, margin)) {
                doc.addPage();
                y = margin;
              }

              // Adicionar título da imagem
              doc
                .fontSize(10)
                .font(fonts.bold)
                .fillColor(colors.text)
                .text(titleText, margin, y + 5, {
                  width: contentWidth,
                });

              y += titleHeight + 10;

              // Baixar a imagem e adicioná-la ao PDF
              const imageBuffer = await downloadImage(evidence.imageUrl);
              if (imageBuffer) {
                // Calcular dimensões para manter a proporção e caber na página
                const maxWidth = contentWidth;
                const maxHeight = 180; // Reduzido para garantir que caiba na página

                // Adicionar a imagem com dimensões adequadas
                doc.image(imageBuffer, margin, y, {
                  fit: [maxWidth, maxHeight],
                  align: "center",
                  valign: "center",
                });

                // Atualizar a posição Y baseado na altura da imagem renderizada
                const imgDims = doc.image.info;
                const imgHeight = Math.min(
                  maxHeight,
                  imgDims.height * (maxWidth / imgDims.width)
                );
                y += imgHeight + 15;
              } else {
                // Se não conseguir baixar a imagem, mostrar o link
                doc
                  .fontSize(9)
                  .font(fonts.italic)
                  .fillColor(colors.accent)
                  .text(`Link da imagem: ${evidence.imageUrl}`, margin, y, {
                    width: contentWidth,
                    link: evidence.imageUrl,
                    underline: true,
                  });
                y += 15;
              }
            } catch (error) {
              console.error("Erro ao adicionar imagem:", error);
              // Em caso de erro, mostrar apenas o link
              doc
                .fontSize(9)
                .font(fonts.italic)
                .fillColor(colors.accent)
                .text(`Link da imagem: ${evidence.imageUrl}`, margin, y, {
                  width: contentWidth,
                  link: evidence.imageUrl,
                  underline: true,
                });
              y += 15;
            }
          }
        }

        currentY = y + 10;
      }

      // Assinatura Digital
      if (report.status === "assinado" && report.digitalSignature) {
        // Altura fixa para a assinatura digital
        const signatureHeight = 120;

        // Verificar se há espaço suficiente para a assinatura digital
        if (needsNewPage(doc, currentY, signatureHeight, margin)) {
          doc.addPage();
          currentY = margin;
        } else {
          currentY = doc.y + 10;
        }

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
      // Verificar se há conteúdo suficiente na página atual para justificar o rodapé
      const contentOnPage = currentY - margin;
      const minContentHeight = 100; // Altura mínima de conteúdo para justificar rodapé

      // Verificar se há espaço para o rodapé e se a página tem conteúdo suficiente
      if (contentOnPage >= minContentHeight) {
        if (needsNewPage(doc, currentY, footerHeight, margin)) {
          // Só adicionar nova página se a atual tiver conteúdo significativo
          doc.addPage();
          addFooter(doc, expert, report, margin, contentWidth);
        } else {
          // Adicionar o rodapé no final da última página com conteúdo
          addFooter(doc, expert, report, margin, contentWidth);
        }
      } else if (doc.bufferedPageRange().count > 1) {
        // Se a última página tem pouco conteúdo mas temos múltiplas páginas,
        // adicionar o rodapé na página atual mesmo assim
        addFooter(doc, expert, report, margin, contentWidth);
      }

      // Adicionar numeração de páginas
      const pageRange = doc.bufferedPageRange();
      const totalPages = pageRange.count;

      // Percorrer todas as páginas para adicionar numeração
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        // Adicionar numeração de página
        doc
          .fontSize(8)
          .fillColor(colors.lightText)
          .text(
            `Página ${i + 1} de ${totalPages}`,
            margin,
            doc.page.height - 20,
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
 * Função para baixar uma imagem a partir de uma URL
 * @param {String} url - URL da imagem
 * @returns {Promise<Buffer>} - Buffer da imagem
 */
async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
  } catch (error) {
    console.error("Erro ao baixar imagem:", error);
    return null;
  }
}

/**
 * Adiciona cabeçalho ao documento
 * @param {PDFDocument} doc - Documento PDF
 * @param {String} logoPath - Caminho para o logo (opcional)
 * @param {Number} margin - Margem do documento
 * @returns {Number} - Altura final do cabeçalho
 */
const addHeader = async (doc, logoPath, margin) => {
  const contentWidth = doc.page.width - margin * 2;
  const headerHeight = 60;

  // Cabeçalho com fundo claro
  doc
    .rect(margin, margin, contentWidth, headerHeight)
    .fillAndStroke(colors.light, colors.primary);

  // Obter a hora atual correta usando a função auxiliar
  const currentDateTime = getFormattedDateTime();

  if (logoPath && fs.existsSync(logoPath)) {
    doc
      .image(logoPath, margin + 10, margin + 10, { width: 40 })
      .fontSize(12)
      .font(fonts.bold)
      .fillColor(colors.primary)
      .text(
        "SISTEMA DE GESTÃO PERICIAL ODONTOLEGAL - PERIOSCAN",
        margin + 60,
        margin + 15,
        {
          width: contentWidth - 70,
        }
      )
      .fontSize(9)
      .text(
        `Documento gerado em ${currentDateTime}`,
        margin + 60,
        margin + 30,
        {
          width: contentWidth - 70,
        }
      );
  } else {
    doc
      .fontSize(14)
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
      .fontSize(9)
      .text(`Documento gerado em ${currentDateTime}`, margin, margin + 35, {
        align: "center",
        width: contentWidth,
      });
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
    .fontSize(11)
    .font(fonts.bold)
    .fillColor(colors.primary)
    .text(title, margin, yPosition);

  return doc.y + 3;
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
      .rect(margin, y, colWidth[0] + colWidth[1], 18)
      .fill(index % 2 === 0 ? colors.light : "#ffffff");

    // Coluna 1 (label)
    doc
      .fontSize(9)
      .font(fonts.bold)
      .fillColor(colors.text)
      .text(row[0], margin + 5, y + 4, { width: colWidth[0] - 10 });

    // Coluna 2 (valor)
    doc
      .fontSize(9)
      .font(fonts.normal)
      .text(row[1], margin + colWidth[0], y + 4, { width: colWidth[1] - 10 });

    y += 18;
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
  return statusMap[status?.toLowerCase()] || status;
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
const addDigitalSignature = async (
  doc,
  report,
  expert,
  margin,
  yPosition,
  width
) => {
  const boxHeight = 100;

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
    .fontSize(9)
    .font(fonts.bold)
    .fillColor(colors.primary)
    .text("Documento assinado digitalmente por:", margin + 10, yPosition + 10)
    .font(fonts.normal)
    .text(`${signerName} (${signerEmail})`, margin + 10, yPosition + 22)
    .text(
      `Data e hora: ${getFormattedDateTime(
        report.digitalSignature.signatureDate
      )}`,
      margin + 10,
      yPosition + 34
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
    .text(`Hash de verificação: ${documentHash}`, margin + 10, yPosition + 46);

  try {
    const verificationUrl = `${
      process.env.APP_URL || "https://perioscan-back-end.onrender.com"
    }/api/reports/verify/${report._id}?hash=${
      report.digitalSignature.contentHash || documentHash
    }&code=${report.digitalSignature.verificationCode || ""}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    doc
      .image(qrCodeDataUrl, margin + width - 80, yPosition + 10, { width: 70 })
      .fontSize(7)
      .text(
        "Escaneie o QR code para verificar a autenticidade",
        margin + width - 160,
        yPosition + 85,
        {
          width: 140,
          align: "center",
        }
      );
  } catch (error) {
    console.error("Erro ao gerar QR code:", error);
    doc
      .fontSize(7)
      .text(
        "Não foi possível gerar o QR code",
        margin + width - 160,
        yPosition + 50,
        {
          width: 140,
          align: "center",
        }
      );
  }

  return yPosition + boxHeight + 5;
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
  // Calcular posição Y para o rodapé (mais próximo do final da página)
  const footerY = doc.page.height - 60;

  doc
    .fontSize(9)
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

  const { text, color } =
    watermarkConfig[status?.toLowerCase()] || watermarkConfig.default;

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
