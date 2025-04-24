import PDFDocument from "pdfkit";
import moment from "moment-timezone";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import QRCode from "qrcode";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import axios from "axios";

moment.locale("pt-br");
moment.tz.setDefault("America/Sao_Paulo");

const cores = {
  primaria: "#000000",
  secundaria: "#333333",
  detalhe: "#666666",
  fundo: "#f5f5f5",
  texto: "#333333",
  textoClaro: "#666666",
  sucesso: "#2e7d32",
  alerta: "#f9a825",
  perigo: "#c62828",
};

const fontes = {
  normal: "Helvetica",
  negrito: "Helvetica-Bold",
  italico: "Helvetica-Oblique",
  negritoItalico: "Helvetica-BoldOblique",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateReportPDF = async (
  laudo,
  caso,
  perito,
  evidencias,
  opcoes = {}
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const buffers = [];
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        bufferPages: true,
        autoFirstPage: false,
      });

      doc.addPage();
      let paginaAtual = 1;
      const margem = 40;
      const larguraConteudo = doc.page.width - margem * 2;
      const alturaRodape = 70;

      const verificarEspaco = (alturaNecessaria) => {
        return doc.y + alturaNecessaria > doc.page.height - alturaRodape - margem;
      };

      const novaPagina = () => {
        doc.addPage();
        paginaAtual++;
        adicionarCabecalho(doc, opcoes.logoPath, margem);
        adicionarNumeroPagina(doc, paginaAtual);
        return margem;
      };

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      adicionarCabecalho(doc, opcoes.logoPath, margem);
      adicionarNumeroPagina(doc, paginaAtual);

      if (laudo.status !== "assinado") {
        adicionarMarcaDagua(doc, laudo.status);
      }

      let yAtual = margem + 80;

      // Título principal
      doc
        .font(fontes.negrito)
        .fontSize(16)
        .fillColor(cores.primaria)
        .text("LAUDO PERICIAL ODONTOLEGAL", margem, yAtual, {
          align: "center",
          width: larguraConteudo,
        });
      yAtual = doc.y + 20;

      // Seção do Caso
      yAtual = adicionarSecao(
        doc,
        "INFORMAÇÕES DO CASO",
        [
          ["Número do Caso:", laudo.caseNumber || caso._id.toString()],
          ["Título do Caso:", caso.title || "Sem título"],
          ...(caso.occurrenceDate
            ? [["Data do Ocorrido:", moment(caso.occurrenceDate).format("DD/MM/YYYY")]]
            : []),
          ["Status do Caso:", formatarStatus(caso.status)],
          ["Data de Abertura:", moment(caso.openDate).format("DD/MM/YYYY")],
        ],
        margem,
        yAtual,
        larguraConteudo,
        verificarEspaco,
        novaPagina
      );

      // Seção do Laudo
      yAtual = adicionarSecao(
        doc,
        "DETALHES DO LAUDO",
        [
          ["Título:", laudo.title],
          ["Data de Criação:", moment(laudo.createdAt).format("DD/MM/YYYY")],
          ["Perito Responsável:", perito.name],
          ["Status:", formatarStatus(laudo.status)],
          ...(laudo.digitalSignature?.signatureDate
            ? [["Assinado em:", moment(laudo.digitalSignature.signatureDate).format("DD/MM/YYYY HH:mm")]]
            : []),
        ],
        margem,
        yAtual,
        larguraConteudo,
        verificarEspaco,
        novaPagina
      );

      // Metodologia
      if (laudo.methodology) {
        yAtual = adicionarTexto(
          doc,
          "METODOLOGIA",
          laudo.methodology,
          margem,
          yAtual,
          larguraConteudo,
          verificarEspaco,
          novaPagina
        );
      }

      // Descrição
      yAtual = adicionarTexto(
        doc,
        "DESCRIÇÃO",
        laudo.content,
        margem,
        yAtual,
        larguraConteudo,
        verificarEspaco,
        novaPagina
      );

      // Conclusão
      if (laudo.conclusion) {
        yAtual = adicionarTexto(
          doc,
          "CONCLUSÃO",
          laudo.conclusion,
          margem,
          yAtual,
          larguraConteudo,
          verificarEspaco,
          novaPagina
        );
      }

      // Evidências
      if (evidencias?.length > 0) {
        yAtual = await adicionarEvidencias(
          doc,
          evidencias,
          margem,
          yAtual,
          larguraConteudo,
          verificarEspaco,
          novaPagina
        );
      }

      // Assinatura Digital
      if (laudo.status === "assinado" && laudo.digitalSignature) {
        yAtual = await adicionarAssinaturaDigital(
          doc,
          laudo,
          perito,
          margem,
          yAtual,
          larguraConteudo,
          verificarEspaco,
          novaPagina
        );
      }

      // Rodapé final
      adicionarRodape(doc, perito, margem, larguraConteudo);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Funções auxiliares
const adicionarCabecalho = (doc, caminhoLogo, margem) => {
  const alturaCabecalho = 80;
  const dataHora = moment().format("DD/MM/YYYY [às] HH:mm:ss");

  doc
    .rect(margem, margem, doc.page.width - margem * 2, alturaCabecalho)
    .fill(cores.fundo);

  if (caminhoLogo && fs.existsSync(caminhoLogo)) {
    doc.image(caminhoLogo, margem + 10, margem + 10, { width: 60 });
    doc
      .font(fontes.negrito)
      .fontSize(12)
      .fillColor(cores.primaria)
      .text("SISTEMA DE GESTÃO PERICIAL ODONTOLEGAL", margem + 80, margem + 15)
      .fontSize(9)
      .text(`Gerado em: ${dataHora}`, margem + 80, margem + 35);
  } else {
    doc
      .font(fontes.negrito)
      .fontSize(14)
      .fillColor(cores.primaria)
      .text("SISTEMA DE GESTÃO PERICIAL ODONTOLEGAL", margem, margem + 20, {
        align: "center",
        width: doc.page.width - margem * 2,
      })
      .fontSize(9)
      .text(`Gerado em: ${dataHora}`, margem, margem + 40, {
        align: "center",
        width: doc.page.width - margem * 2,
      });
  }

  return alturaCabecalho + margem;
};

const adicionarSecao = (
  doc,
  titulo,
  linhas,
  margem,
  y,
  largura,
  verificarEspaco,
  novaPagina
) => {
  if (verificarEspaco(100)) y = novaPagina();

  doc
    .font(fontes.negrito)
    .fontSize(11)
    .fillColor(cores.primaria)
    .text(titulo, margem, y);
  y = doc.y + 10;

  linhas.forEach(([rotulo, valor], index) => {
    if (verificarEspaco(20)) y = novaPagina();

    doc.rect(margem, y, largura, 20).fill(index % 2 === 0 ? cores.fundo : "#FFF");
    doc
      .font(fontes.negrito)
      .fontSize(9)
      .fillColor(cores.texto)
      .text(rotulo, margem + 5, y + 5);
    doc
      .font(fontes.normal)
      .text(valor, margem + largura * 0.3, y + 5, { width: largura * 0.65 });
    y += 20;
  });

  return y + 10;
};

const adicionarTexto = (
  doc,
  titulo,
  conteudo,
  margem,
  y,
  largura,
  verificarEspaco,
  novaPagina
) => {
  if (verificarEspaco(100)) y = novaPagina();

  doc
    .font(fontes.negrito)
    .fontSize(11)
    .fillColor(cores.primaria)
    .text(titulo, margem, y);
  y = doc.y + 5;

  const alturaTexto = doc.heightOfString(conteudo, {
    width: largura,
    align: "justify",
  });

  if (verificarEspaco(alturaTexto)) y = novaPagina();

  doc
    .font(fontes.normal)
    .fontSize(11)
    .fillColor(cores.texto)
    .text(conteudo, margem, y, {
      width: largura,
      align: "justify",
    });

  return doc.y + 15;
};

const adicionarEvidencias = async (
  doc,
  evidencias,
  margem,
  y,
  largura,
  verificarEspaco,
  novaPagina
) => {
  if (verificarEspaco(100)) y = novaPagina();

  doc
    .font(fontes.negrito)
    .fontSize(11)
    .fillColor(cores.primaria)
    .text("EVIDÊNCIAS ANEXADAS", margem, y);
  y = doc.y + 10;

  const largurasColunas = [40, 280, 100, 80];
  let yTabela = y;

  // Cabeçalho da tabela
  doc
    .rect(margem, yTabela, largura, 20)
    .fill(cores.secundaria)
    .font(fontes.negrito)
    .fontSize(9)
    .fillColor("#FFF")
    .text("Nº", margem + 5, yTabela + 5)
    .text("Descrição", margem + 45, yTabela + 5)
    .text("Tipo", margem + 325, yTabela + 5)
    .text("Coleta", margem + 425, yTabela + 5);

  yTabela += 20;

  for (const [index, evidencia] of evidencias.entries()) {
    if (verificarEspaco(40)) yTabela = novaPagina() + 20;

    doc
      .rect(margem, yTabela, largura, 20)
      .fill(index % 2 === 0 ? cores.fundo : "#FFF");

    doc
      .fontSize(9)
      .fillColor(cores.texto)
      .text((index + 1).toString(), margem + 5, yTabela + 5)
      .text(evidencia.description || "Sem descrição", margem + 45, yTabela + 5)
      .text(formatarTipoEvidencia(evidencia.type), margem + 325, yTabela + 5)
      .text(
        evidencia.collectionDate
          ? moment(evidencia.collectionDate).format("DD/MM/YYYY")
          : "N/A",
        margem + 425,
        yTabela + 5
      );

    yTabela += 20;

    if (evidencia.type === "image" && evidencia.imageUrl) {
      try {
        const bufferImagem = await axios.get(evidencia.imageUrl, {
          responseType: "arraybuffer",
        });
        const alturaImagem = 150;
        
        if (verificarEspaco(alturaImagem + 30)) yTabela = novaPagina();

        doc.image(bufferImagem.data, margem, yTabela, {
          width: largura,
          height: alturaImagem,
        });
        yTabela += alturaImagem + 10;
      } catch (error) {
        doc
          .fontSize(9)
          .fillColor(cores.alerta)
          .text(`Erro ao carregar imagem: ${evidencia.imageUrl}`, margem, yTabela);
        yTabela += 20;
      }
    }
  }

  return yTabela + 20;
};

const adicionarAssinaturaDigital = async (
  doc,
  laudo,
  perito,
  margem,
  y,
  largura,
  verificarEspaco,
  novaPagina
) => {
  if (verificarEspaco(150)) y = novaPagina();

  const alturaSecao = 120;
  doc
    .rect(margem, y, largura, alturaSecao)
    .fill(cores.fundo)
    .stroke(cores.detalhe);

  const hash = crypto
    .createHash("sha256")
    .update(laudo._id + laudo.content + laudo.digitalSignature.signatureDate)
    .digest("hex");

  doc
    .fontSize(9)
    .fillColor(cores.primaria)
    .text("ASSINATURA DIGITAL", margem + 10, y + 10)
    .font(fontes.normal)
    .text(`Perito: ${perito.name}`, margem + 10, y + 25)
    .text(`Data: ${moment(laudo.digitalSignature.signatureDate).format("DD/MM/YYYY HH:mm")}`, margem + 10, y + 40)
    .text(`Hash: ${hash.slice(0, 32)}...`, margem + 10, y + 55);

  try {
    const urlVerificacao = `${process.env.APP_URL}/verify/${laudo._id}?hash=${hash}`;
    const qrCode = await QRCode.toDataURL(urlVerificacao);
    doc.image(qrCode, margem + largura - 100, y + 10, { width: 90 });
  } catch (error) {
    doc
      .fontSize(8)
      .fillColor(cores.alerta)
      .text("Erro ao gerar QR Code", margem + largura - 100, y + 10);
  }

  return y + alturaSecao + 20;
};

const adicionarRodape = (doc, perito, margem, largura) => {
  const yRodape = doc.page.height - 60;
  if (doc.y < yRodape - 30) {
    doc
      .fontSize(9)
      .fillColor(cores.primaria)
      .text("___________________________", margem, yRodape, {
        align: "center",
        width: largura,
      })
      .text(perito.name, margem, doc.y, { align: "center", width: largura })
      .text(`CRO: ${perito.cro || "N/A"}`, margem, doc.y, {
        align: "center",
        width: largura,
      });
  }
};

const adicionarNumeroPagina = (doc, numero) => {
  doc
    .fontSize(8)
    .fillColor(cores.textoClaro)
    .text(`Página ${numero}`, 40, doc.page.height - 30, {
      align: "center",
      width: doc.page.width - 80,
    });
};

const formatarStatus = (status) => {
  const statusMap = {
    draft: "Rascunho",
    pending: "Pendente",
    signed: "Assinado",
    archived: "Arquivado",
  };
  return statusMap[status] || status;
};

const formatarTipoEvidencia = (tipo) => {
  const tipos = {
    image: "Imagem",
    document: "Documento",
    video: "Vídeo",
    audio: "Áudio",
  };
  return tipos[tipo] || tipo;
};

const adicionarMarcaDagua = (doc, status) => {
  const marcas = {
    draft: { texto: "RASCUNHO", cor: cores.alerta },
    pending: { texto: "AGUARDANDO ASSINATURA", cor: cores.detalhe },
    default: { texto: "DOCUMENTO NÃO ASSINADO", cor: cores.textoClaro },
  };

  const config = marcas[status] || marcas.default;
  doc
    .save()
    .font(fontes.negrito)
    .fontSize(72)
    .fillColor(config.cor)
    .opacity(0.1)
    .rotate(45)
    .text(config.texto, 100, 400)
    .restore();
};
