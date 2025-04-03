import PDFDocument from "pdfkit";
import moment from "moment";
import path from "path";
import { fileURLToPath } from "url";

// Configurar moment para português do Brasil
moment.locale("pt-br");

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Gera um PDF para um laudo pericial
 * @param {Object} report - O laudo a ser convertido em PDF
 * @param {Object} forensicCase - O caso relacionado ao laudo
 * @param {Object} expert - O perito responsável pelo laudo
 * @param {Array} evidences - Lista de evidências anexadas ao laudo
 * @returns {Promise<Buffer>} - Buffer contendo o PDF gerado
 */
export const generateReportPDF = async (
  report,
  forensicCase,
  expert,
  evidences
) => {
  return new Promise((resolve, reject) => {
    try {
      // Criar um buffer para armazenar o PDF
      const buffers = [];

      // Criar um novo documento PDF
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Forensic Report - ${report.title}`,
          Author: expert.name,
          Subject: "Forensic Dental Report",
          Keywords: "forensic, dental, report, odontology",
          Creator: "Forensic Dental Management System",
        },
      });

      // Capturar os chunks do PDF no buffer
      doc.on("data", buffers.push.bind(buffers));

      // Quando o documento estiver finalizado, resolver a promessa com o buffer
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Adicionar cabeçalho
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("FORENSIC DENTAL REPORT", { align: "center" });
      doc.moveDown();

      // Adicionar informações do caso
      doc.fontSize(12).font("Helvetica-Bold").text("Informação do caso");
      doc.fontSize(10).font("Helvetica");
      doc.text(`Case Number: ${report.caseNumber || forensicCase._id}`);
      doc.text(`Title: ${forensicCase.title}`);
      doc.text(
        `Open Date: ${moment(forensicCase.openDate).format("DD/MM/YYYY")}`
      );
      doc.text(`Status: ${forensicCase.status}`);
      doc.moveDown();

      // Adicionar informações do laudo
      doc.fontSize(12).font("Helvetica-Bold").text("REPORT DETAILS");
      doc.fontSize(10).font("Helvetica");
      doc.text(`Title: ${report.title}`);
      doc.text(
        `Creation Date: ${moment(report.createdAt).format("DD/MM/YYYY")}`
      );
      doc.text(`Expert Responsible: ${expert.name}`);
      doc.text(`Status: ${report.status}`);

      if (report.digitalSignature && report.digitalSignature.signatureDate) {
        doc.text(
          `Signed on: ${moment(report.digitalSignature.signatureDate).format(
            "DD/MM/YYYY HH:mm:ss"
          )}`
        );
      }

      doc.moveDown();

      // Adicionar metodologia se existir
      if (report.methodology) {
        doc.fontSize(12).font("Helvetica-Bold").text("METHODOLOGY");
        doc.fontSize(10).font("Helvetica");
        doc.text(report.methodology);
        doc.moveDown();
      }

      // Adicionar conteúdo do laudo
      doc.fontSize(12).font("Helvetica-Bold").text("DESCRIPTION");
      doc.fontSize(10).font("Helvetica");
      doc.text(report.content, { align: "justify" });
      doc.moveDown();

      // Adicionar conclusão se existir
      if (report.conclusion) {
        doc.fontSize(12).font("Helvetica-Bold").text("CONCLUSION");
        doc.fontSize(10).font("Helvetica");
        doc.text(report.conclusion, { align: "justify" });
        doc.moveDown();
      }

      // Adicionar lista de evidências anexadas
      if (evidences && evidences.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").text("ATTACHED EVIDENCE");
        doc.fontSize(10).font("Helvetica");

        evidences.forEach((evidence, index) => {
          doc.text(
            `${index + 1}. ${evidence.description || "No description"} (${
              evidence.type
            })`
          );
          if (evidence.collectionDate) {
            doc.text(
              `   Collection Date: ${moment(evidence.collectionDate).format(
                "DD/MM/YYYY"
              )}`
            );
          }
        });

        doc.moveDown();
      }

      // Adicionar rodapé com assinatura
      doc.fontSize(10).font("Helvetica");
      doc.text("_______________________________", { align: "center" });
      doc.text(expert.name, { align: "center" });
      doc.text(`Forensic Odontologist - ${expert.email}`, { align: "center" });

      // Adicionar data e local
      doc.moveDown();
      doc.text(
        `Place and date: __________________, ${moment().format(
          "DD of MMMM, YYYY"
        )}`,
        { align: "center" }
      );

      // Finalizar o documento
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
