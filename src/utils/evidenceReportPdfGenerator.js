import PDFDocument from "pdfkit";
import moment from "moment";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import QRCode from "qrcode";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import axios from "axios";

// Configurar moment para português do Brasil
moment.locale("pt-br");

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Atualizar a paleta de cores para preto, branco e cinza
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
 * Gera um PDF para um relatório de evidência
 * @param {Object} report - O relatório a ser convertido em PDF
 * @param {Object} evidence - A evidência relacionada ao relatório
 * @param {Object} forensicCase - O caso relacionado ao relatório
 * @param {Object} expert - O perito responsável pelo relatório
 * @param {Object} options - Opções adicionais para a geração do PDF
 * @returns {Promise<Buffer>} - Buffer contendo o PDF gerado
 */
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
        margin: 40, // Reduzir margens para aproveitar mais espaço
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: `Relatório de Evidência - ${report.title}`,
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

      // Definir margens consistentes
      const margin = 40;
      const contentWidth = doc.page.width - margin * 2;

      // Marca d'água (em camada inferior)
      if (report.status !== "assinado") {
        addWatermark(doc, report.status);
      }

      // Cabeçalho
      const headerHeight = await addHeader(doc, options.logoPath, margin);
      let currentY = headerHeight + 10; // Reduzir espaço após o cabeçalho

      // Título principal
      doc
        .fontSize(16)
        .font(fonts.bold)
        .fillColor(colors.primary)
        .text("RELATÓRIO DE ANÁLISE DE EVIDÊNCIA", margin, currentY, {
          align: "center",
          width: contentWidth,
        });

      currentY = doc.y + 10; // Reduzir espaço após o título

      // Seção do Caso
      currentY = addSectionTitle(doc, "INFORMAÇÕES DO CASO", margin, currentY);

      const caseInfo = [
        ["Número do Caso:", forensicCase._id.toString()],
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
      currentY += 10; // Reduzir espaço após a tabela

      // Seção da Evidência
      currentY = addSectionTitle(
        doc,
        "DETALHES DA EVIDÊNCIA",
        margin,
        currentY
      );

      const evidenceInfo = [
        ["ID da Evidência:", evidence._id.toString()],
        ["Tipo de Evidência:", evidence.type === "image" ? "Imagem" : "Texto"],
        ["Descrição:", evidence.description || "Sem descrição"],
        [
          "Data de Coleta:",
          moment(evidence.collectionDate).format("DD/MM/YYYY"),
        ],
      ];

      if (evidence.collectedBy && evidence.collectedBy.name) {
        evidenceInfo.push(["Coletado por:", evidence.collectedBy.name]);
      }

      // Metadados específicos
      if (evidence.type === "image") {
        const imageType = evidence.imageType || "outro";

        if (evidence.cloudinary) {
          if (evidence.cloudinary.width && evidence.cloudinary.height) {
            evidenceInfo.push([
              "Dimensões:",
              `${evidence.cloudinary.width}x${evidence.cloudinary.height} pixels`,
            ]);
          }

          if (evidence.cloudinary.format) {
            evidenceInfo.push([
              "Formato:",
              evidence.cloudinary.format.toUpperCase(),
            ]);
          }
        }

        evidenceInfo.push(["Tipo de Imagem:", formatImageType(imageType)]);
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

      currentY = addTable(doc, evidenceInfo, margin, currentY, contentWidth);
      currentY += 10; // Reduzir espaço após a tabela

      // Verificar se é necessário adicionar uma nova página
      if (doc.y + 200 > doc.page.height) {
        doc.addPage();
        currentY = margin;
      }

      // Conteúdo da Evidência - IMAGEM
      if (evidence.type === "image" && evidence.imageUrl) {
        currentY = addSectionTitle(
          doc,
          "IMAGEM DA EVIDÊNCIA",
          margin,
          currentY
        );

        try {
          // Baixar a imagem e adicioná-la ao PDF
          const imageBuffer = await downloadImage(evidence.imageUrl);
          if (imageBuffer) {
            // Calcular dimensões para manter a proporção e caber na página
            const maxWidth = contentWidth;
            const maxHeight = 200;

            // Adicionar a imagem com dimensões adequadas
            doc.image(imageBuffer, margin, currentY + 10, {
              fit: [maxWidth, maxHeight],
              align: "center",
              valign: "center",
            });

            // Atualizar a posição Y baseado na altura da imagem renderizada
            const imgHeight = Math.min(
              maxHeight,
              doc.image.height * (maxWidth / doc.image.width)
            );
            currentY += imgHeight + 30;

            // Adicionar legenda
            doc
              .fontSize(8)
              .font(fonts.italic)
              .fillColor(colors.lightText)
              .text(`Fonte: ${evidence.imageUrl}`, margin, currentY - 20, {
                align: "center",
                width: contentWidth,
              });
          } else {
            // Se não conseguir baixar a imagem, mostrar o link
            doc
              .fontSize(10)
              .font(fonts.normal)
              .fillColor(colors.text)
              .text(
                "A imagem da evidência está disponível no seguinte link:",
                margin,
                currentY + 10,
                {
                  align: "left",
                  width: contentWidth,
                }
              );

            currentY += 25;

            doc
              .fontSize(9)
              .font(fonts.bold)
              .fillColor(colors.secondary)
              .text(evidence.imageUrl, margin, currentY, {
                align: "left",
                width: contentWidth,
                link: evidence.imageUrl,
                underline: true,
              });

            currentY += 20;
          }
        } catch (error) {
          console.error("Erro ao adicionar imagem:", error);
          // Em caso de erro, mostrar apenas o link
          doc
            .fontSize(10)
            .font(fonts.normal)
            .fillColor(colors.text)
            .text(
              "A imagem da evidência está disponível no seguinte link:",
              margin,
              currentY + 10,
              {
                align: "left",
                width: contentWidth,
              }
            );

          currentY += 25;

          doc
            .fontSize(9)
            .font(fonts.bold)
            .fillColor(colors.secondary)
            .text(evidence.imageUrl, margin, currentY, {
              align: "left",
              width: contentWidth,
              link: evidence.imageUrl,
              underline: true,
            });

          currentY += 20;
        }
      } else if (evidence.type === "text" && evidence.content) {
        currentY = addSectionTitle(
          doc,
          "CONTEÚDO DA EVIDÊNCIA",
          margin,
          currentY
        );

        doc
          .fontSize(9)
          .font(fonts.italic)
          .fillColor(colors.text)
          .text(evidence.content, margin, currentY, {
            align: "justify",
            width: contentWidth,
          });

        currentY = doc.y + 10; // Reduzir espaço após o conteúdo
      }

      // Verificar se é necessário adicionar uma nova página
      if (doc.y + 200 > doc.page.height) {
        doc.addPage();
        currentY = margin;
      }

      // Seção do Relatório
      currentY = addSectionTitle(
        doc,
        "DETALHES DO RELATÓRIO",
        margin,
        currentY
      );

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
      currentY += 10; // Reduzir espaço após a tabela

      // Conteúdo do Relatório
      if (report.methodology) {
        currentY = addSectionTitle(doc, "METODOLOGIA", margin, currentY);

        doc
          .fontSize(10)
          .font(fonts.normal)
          .fillColor(colors.text)
          .text(report.methodology, margin, currentY, {
            align: "justify",
            width: contentWidth,
          });

        currentY = doc.y + 10; // Reduzir espaço após a metodologia
      }

      currentY = addSectionTitle(doc, "ANÁLISE", margin, currentY);

      doc
        .fontSize(10)
        .font(fonts.normal)
        .fillColor(colors.text)
        .text(report.content, margin, currentY, {
          align: "justify",
          width: contentWidth,
        });

      currentY = doc.y + 10; // Reduzir espaço após a análise

      currentY = addSectionTitle(doc, "DESCOBERTAS", margin, currentY);

      doc
        .fontSize(10)
        .font(fonts.normal)
        .fillColor(colors.text)
        .text(report.findings, margin, currentY, {
          align: "justify",
          width: contentWidth,
        });

      currentY = doc.y + 10; // Reduzir espaço após as descobertas

      if (report.conclusion) {
        currentY = addSectionTitle(doc, "CONCLUSÃO", margin, currentY);

        doc
          .fontSize(10)
          .font(fonts.normal)
          .fillColor(colors.text)
          .text(report.conclusion, margin, currentY, {
            align: "justify",
            width: contentWidth,
          });

        currentY = doc.y + 10; // Reduzir espaço após a conclusão
      }

      // Assinatura Digital
      if (report.status === "assinado" && report.digitalSignature) {
        // Verificar se é necessário adicionar uma nova página
        if (doc.y + 150 > doc.page.height) {
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
      // Verificar se há espaço suficiente para o rodapé
      if (doc.y + 70 > doc.page.height) {
        doc.addPage();
      }

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
  const headerHeight = 60; // Reduzir altura do cabeçalho

  // Cabeçalho com fundo claro
  doc
    .rect(margin, margin, contentWidth, headerHeight)
    .fillAndStroke(colors.light, colors.primary);

  // Obter a hora atual correta
  const currentDateTime = moment().format("DD/MM/YYYY [às] HH:mm:ss");

  if (logoPath && fs.existsSync(logoPath)) {
    doc
      .image(logoPath, margin + 10, margin + 10, { width: 40 }) // Reduzir tamanho do logo
      .fontSize(12) // Reduzir tamanho da fonte
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
      .fontSize(9) // Reduzir tamanho da fonte
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
      .fontSize(14) // Reduzir tamanho da fonte
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
      .fontSize(9) // Reduzir tamanho da fonte
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

  return doc.y + 3; // Reduzir espaço após o título
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
      .fill(index % 2 === 0 ? colors.light : "#ffffff"); // Reduzir altura da linha

    // Coluna 1 (label)
    doc
      .fontSize(9) // Reduzir tamanho da fonte
      .font(fonts.bold)
      .fillColor(colors.text)
      .text(row[0], margin + 5, y + 4, { width: colWidth[0] - 10 }); // Ajustar posição vertical

    // Coluna 2 (valor)
    doc
      .fontSize(9) // Reduzir tamanho da fonte
      .font(fonts.normal)
      .text(row[1], margin + colWidth[0], y + 4, { width: colWidth[1] - 10 }); // Ajustar posição vertical

    y += 18; // Reduzir altura da linha
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
 * Formata o tipo de imagem para exibição
 * @param {String} imageType - Tipo de imagem
 * @returns {String} - Tipo de imagem formatado
 */
const formatImageType = (imageType) => {
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
};

/**
 * Formata o tipo de conteúdo para exibição
 * @param {String} contentType - Tipo de conteúdo
 * @returns {String} - Tipo de conteúdo formatado
 */
const formatContentType = (contentType) => {
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
  const boxHeight = 100; // Reduzir altura da caixa de assinatura

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
    .fontSize(9) // Reduzir tamanho da fonte
    .font(fonts.bold)
    .fillColor(colors.primary)
    .text("Documento assinado digitalmente por:", margin + 10, yPosition + 10)
    .font(fonts.normal)
    .text(`${signerName} (${signerEmail})`, margin + 10, yPosition + 22)
    .text(
      `Data e hora: ${moment(report.digitalSignature.signatureDate).format(
        "DD/MM/YYYY [às] HH:mm:ss"
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
    .fontSize(7) // Reduzir tamanho da fonte
    .font(fonts.italic)
    .text(`Hash de verificação: ${documentHash}`, margin + 10, yPosition + 46);

  try {
    const verificationUrl = `${
      process.env.APP_URL || "https://perioscan-back-end.onrender.com"
    }/api/evidence-reports/verify/${report._id}?hash=${
      report.digitalSignature.contentHash || documentHash
    }&code=${report.digitalSignature.verificationCode || ""}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

    doc
      .image(qrCodeDataUrl, margin + width - 80, yPosition + 10, { width: 70 }) // Reduzir tamanho do QR code
      .fontSize(7) // Reduzir tamanho da fonte
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

  return yPosition + boxHeight + 5; // Reduzir espaço após a assinatura
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
    .fontSize(9) // Reduzir tamanho da fonte
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

export default generateEvidenceReportPDF;
