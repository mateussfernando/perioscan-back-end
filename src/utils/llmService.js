import axios from "axios";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Serviço para integração com LLM via OpenRouter API
 */
class LLMService {
  constructor() {
    this.apiKey =
      process.env.OPENROUTER_API_KEY ||
      "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";
    this.baseUrl =
      process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
    this.model =
      process.env.OPENROUTER_MODEL || "deepseek/deepseek-prover-v2:free";
  }

  /**
   * Configura o cliente HTTP com os headers necessários
   * @returns {Object} Cliente axios configurado
   */
  getClient() {
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://perioscan.com", // Domínio da aplicação
        "X-Title": "PerioScan Forensic System", // Nome da aplicação
      },
    });
  }

  /**
   * Gera um relatório forense baseado em um caso e suas evidências
   * @param {Object} forensicCase - O caso forense
   * @param {Array} evidences - Lista de evidências relacionadas ao caso
   * @returns {Promise<Object>} Conteúdo gerado pelo LLM
   */
  async generateForensicReport(forensicCase, evidences = []) {
    const client = this.getClient();

    // Preparar o contexto do caso
    const caseContext = this.prepareCaseContext(forensicCase);

    // Preparar o contexto das evidências
    const evidencesContext = this.prepareEvidencesContext(evidences);

    // Construir o prompt para o LLM
    const prompt = this.buildReportPrompt(caseContext, evidencesContext);

    try {
      const response = await client.post("/chat/completions", {
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista forense odontolegal experiente. Seu trabalho é analisar casos e evidências para produzir laudos técnicos precisos e profissionais.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return {
        content: response.data.choices[0].message.content,
        methodology: this.extractMethodology(
          response.data.choices[0].message.content
        ),
        conclusion: this.extractConclusion(
          response.data.choices[0].message.content
        ),
      };
    } catch (error) {
      console.error(
        "Erro ao gerar relatório com LLM:",
        error.response?.data || error.message
      );
      throw new Error(`Falha ao gerar relatório com IA: ${error.message}`);
    }
  }

  /**
   * Gera um relatório de evidência baseado em uma evidência específica
   * @param {Object} evidence - A evidência a ser analisada
   * @param {Object} forensicCase - O caso relacionado à evidência
   * @returns {Promise<Object>} Conteúdo gerado pelo LLM
   */
  async generateEvidenceReport(evidence, forensicCase) {
    const client = this.getClient();

    // Preparar o contexto da evidência
    const evidenceContext = this.prepareSingleEvidenceContext(evidence);

    // Preparar o contexto do caso
    const caseContext = this.prepareCaseContext(forensicCase);

    // Construir o prompt para o LLM
    const prompt = this.buildEvidenceReportPrompt(evidenceContext, caseContext);

    try {
      const response = await client.post("/chat/completions", {
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista forense odontolegal experiente. Seu trabalho é analisar evidências e produzir relatórios técnicos precisos e profissionais.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.data.choices[0].message.content;
      return {
        content: content,
        title: this.extractTitle(content),
        findings: this.extractFindings(content),
        methodology: this.extractMethodology(content),
        conclusion: this.extractConclusion(content),
      };
    } catch (error) {
      console.error(
        "Erro ao gerar relatório de evidência com LLM:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao gerar relatório de evidência com IA: ${error.message}`
      );
    }
  }

  /**
   * Gera um relatório pericial apenas com dados do caso (sem evidências)
   * @param {Object} forensicCase - O caso forense
   * @returns {Promise<Object>} Conteúdo gerado pelo LLM
   */
  async generateCaseOnlyReport(forensicCase) {
    const client = this.getClient();
    // Preparar o contexto do caso
    const caseContext = this.prepareCaseContext(forensicCase);
    // Construir o prompt para o LLM
    const prompt = `Como especialista forense odontolegal, elabore um laudo técnico detalhado para o seguinte caso, utilizando apenas as informações fornecidas abaixo (não há evidências disponíveis):\n\n${caseContext}\n\nEstrutura do laudo:\n- Título: [título técnico]\n- Conteúdo: [texto principal do laudo]\n- Metodologia: [metodologia utilizada]\n- Conclusão: [conclusão técnica]\n\nUse linguagem técnica e profissional apropriada para um relatório pericial.\n`;
    try {
      const response = await client.post("/chat/completions", {
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista forense odontolegal experiente. Seu trabalho é analisar casos e produzir relatórios técnicos precisos e profissionais.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      });
      const content = response.data.choices[0].message.content;
      return {
        content: content,
        title: this.extractTitle(content),
        methodology: this.extractMethodology(content),
        conclusion: this.extractConclusion(content),
      };
    } catch (error) {
      console.error(
        "Erro ao gerar relatório de caso com LLM:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao gerar relatório de caso com IA: ${error.message}`
      );
    }
  }

  /**
   * Gera um relatório pericial com dados do caso e das evidências
   * @param {Object} forensicCase - O caso forense
   * @param {Array} evidences - Lista de evidências relacionadas ao caso
   * @returns {Promise<Object>} Conteúdo gerado pelo LLM
   */
  async generateCaseWithEvidencesReport(forensicCase, evidences = []) {
    const client = this.getClient();
    // Preparar o contexto do caso
    const caseContext = this.prepareCaseContext(forensicCase);
    // Preparar o contexto das evidências
    const evidencesContext = this.prepareEvidencesContext(evidences);
    // Construir o prompt para o LLM
    const prompt = `Como especialista forense odontolegal, elabore um laudo técnico detalhado para o seguinte caso, utilizando as informações do caso e das evidências fornecidas abaixo:\n\n${caseContext}\n\n${evidencesContext}\n\nEstrutura do laudo:\n- Título: [título técnico]\n- Conteúdo: [texto principal do laudo]\n- Metodologia: [metodologia utilizada]\n- Conclusão: [conclusão técnica]\n\nUse linguagem técnica e profissional apropriada para um relatório pericial.\n`;
    try {
      const response = await client.post("/chat/completions", {
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista forense odontolegal experiente. Seu trabalho é analisar casos e evidências para produzir relatórios técnicos precisos e profissionais.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });
      const content = response.data.choices[0].message.content;
      return {
        content: content,
        title: this.extractTitle(content),
        methodology: this.extractMethodology(content),
        conclusion: this.extractConclusion(content),
      };
    } catch (error) {
      console.error(
        "Erro ao gerar relatório de caso com evidências no LLM:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha ao gerar relatório de caso com evidências e IA: ${error.message}`
      );
    }
  }

  /**
   * Prepara o contexto do caso para o prompt
   * @param {Object} forensicCase - O caso forense
   * @returns {String} Contexto formatado do caso
   */
  prepareCaseContext(forensicCase) {
    return `
      INFORMAÇÕES DO CASO:
      Número do Caso: ${forensicCase.caseNumber || "Não informado"}
      Título: ${forensicCase.title || "Não informado"}
      Descrição: ${forensicCase.description || "Não informado"}
      Tipo: ${forensicCase.type || "Não informado"}
      Status: ${forensicCase.status || "Não informado"}
      Data de Abertura: ${
        forensicCase.openDate
          ? new Date(forensicCase.openDate).toLocaleDateString("pt-BR")
          : "Não informado"
      }
      Data de Ocorrência: ${
        forensicCase.occurrenceDate
          ? new Date(forensicCase.occurrenceDate).toLocaleDateString("pt-BR")
          : "Não informado"
      }
      Localização: ${forensicCase.location || "Não informado"}
    `;
  }

  /**
   * Prepara o contexto de múltiplas evidências para o prompt
   * @param {Array} evidences - Lista de evidências
   * @returns {String} Contexto formatado das evidências
   */
  prepareEvidencesContext(evidences) {
    if (!evidences || evidences.length === 0) {
      return "EVIDÊNCIAS: Nenhuma evidência disponível para este caso.";
    }

    let evidencesText = "EVIDÊNCIAS DISPONÍVEIS:\n";

    evidences.forEach((evidence, index) => {
      evidencesText += `
      Evidência ${index + 1}:
      Tipo: ${evidence.type === "image" ? "Imagem" : "Texto"}
      Descrição: ${evidence.description || "Não informado"}
      Data de Coleta: ${
        evidence.collectionDate
          ? new Date(evidence.collectionDate).toLocaleDateString("pt-BR")
          : "Não informado"
      }
      `;

      if (evidence.type === "image") {
        evidencesText += `
        Tipo de Imagem: ${evidence.imageType || "Não especificado"}
        URL da Imagem: ${evidence.imageUrl || "Não disponível"}
        `;
      } else if (evidence.type === "text") {
        evidencesText += `
        Tipo de Conteúdo: ${evidence.contentType || "Não especificado"}
        Conteúdo: ${evidence.content || "Não disponível"}
        `;
      }
    });

    return evidencesText;
  }

  /**
   * Prepara o contexto de uma única evidência para o prompt
   * @param {Object} evidence - A evidência
   * @returns {String} Contexto formatado da evidência
   */
  prepareSingleEvidenceContext(evidence) {
    let evidenceText = "DETALHES DA EVIDÊNCIA:\n";

    evidenceText += `
      Tipo: ${evidence.type === "image" ? "Imagem" : "Texto"}
      Descrição: ${evidence.description || "Não informado"}
      Data de Coleta: ${
        evidence.collectionDate
          ? new Date(evidence.collectionDate).toLocaleDateString("pt-BR")
          : "Não informado"
      }
    `;

    if (evidence.type === "image") {
      evidenceText += `
      Tipo de Imagem: ${evidence.imageType || "Não especificado"}
      URL da Imagem: ${evidence.imageUrl || "Não disponível"}
      `;

      if (evidence.cloudinary) {
        evidenceText += `
        Dimensões: ${evidence.cloudinary.width || "N/A"} x ${
          evidence.cloudinary.height || "N/A"
        }
        Formato: ${evidence.cloudinary.format || "N/A"}
        `;
      }
    } else if (evidence.type === "text") {
      evidenceText += `
      Tipo de Conteúdo: ${evidence.contentType || "Não especificado"}
      Conteúdo: ${evidence.content || "Não disponível"}
      `;
    }

    return evidenceText;
  }

  /**
   * Constrói o prompt para geração de laudo completo
   * @param {String} caseContext - Contexto do caso
   * @param {String} evidencesContext - Contexto das evidências
   * @returns {String} Prompt completo
   */
  buildReportPrompt(caseContext, evidencesContext) {
    return `
    Como especialista forense odontolegal, elabore um laudo técnico completo para o seguinte caso:
    
    ${caseContext}
    
    ${evidencesContext}
    
    Seu laudo deve seguir a seguinte estrutura:
    
    1. INTRODUÇÃO: Apresente o caso e o objetivo do laudo.
    
    2. METODOLOGIA: Descreva detalhadamente os métodos e técnicas utilizados na análise forense odontolegal.
    
    3. ANÁLISE DAS EVIDÊNCIAS: Analise cada evidência disponível, destacando aspectos relevantes para o caso.
    
    4. DISCUSSÃO: Interprete os achados à luz da literatura científica e da sua experiência profissional.
    
    5. CONCLUSÃO: Apresente as conclusões baseadas na análise realizada.
    
    Utilize linguagem técnica apropriada para um documento pericial odontolegal, mantendo objetividade e precisão científica.
    `;
  }

  /**
   * Constrói o prompt para geração de relatório de evidência
   * @param {String} evidenceContext - Contexto da evidência
   * @param {String} caseContext - Contexto do caso
   * @returns {String} Prompt completo
   */
  buildEvidenceReportPrompt(evidenceContext, caseContext) {
    // Extrair informações relevantes do contexto
    const evidenceType = evidenceContext.includes("Tipo: Imagem")
      ? "image"
      : "text";
    const hasImageUrl =
      evidenceContext.includes("URL da Imagem") &&
      !evidenceContext.includes("URL da Imagem: Não disponível");
    const hasContent =
      evidenceContext.includes("Conteúdo:") &&
      !evidenceContext.includes("Conteúdo: Não disponível");

    // Extrair título e descrição do caso
    const caseTitle =
      caseContext.match(/Título: ([^\n]*)/)?.[1] || "Não informado";
    const caseDescription =
      caseContext.match(/Descrição: ([^\n]*)/)?.[1] || "Não fornecida";

    // Extrair descrição da evidência
    const evidenceDescription =
      evidenceContext.match(/Descrição: ([^\n]*)/)?.[1] || "Não fornecida";

    return `
    Você é um perito forense especializado em análise de evidências e informações relacionadas. Gere um relatório técnico detalhado para a seguinte evidência: 
     
    CASO: ${caseTitle} 
    DESCRIÇÃO DO CASO: ${caseDescription} 
    TIPO DE EVIDÊNCIA: ${evidenceType === "image" ? "Imagem" : "Texto"} 
    DESCRIÇÃO DA EVIDÊNCIA: ${evidenceDescription} 
    ${
      hasContent
        ? `CONTEÚDO DA EVIDÊNCIA: ${
            evidenceContext.match(/Conteúdo: ([^\n]*)/)?.[1]
          }`
        : ""
    } 
    ${hasImageUrl ? `IMAGEM: A evidência contém uma imagem` : ""} 
     
    O relatório deve incluir: 
    1. Um título técnico e profissional 
    2. Metodologia detalhada de análise 
    3. Achados técnicos baseados no tipo de evidência 
    4. Conclusão técnica 
     
    Formato: 
    - Título: [título técnico] 
    - Metodologia: [metodologia detalhada] 
    - Achados: [achados técnicos] 
    - Conclusão: [conclusão técnica] 
     
    Use linguagem técnica e profissional apropriada para um relatório pericial.
    `;
  }

  /**
   * Extrai a metodologia do conteúdo gerado pelo LLM
   * @param {String} content - Conteúdo completo gerado
   * @returns {String} Seção de metodologia extraída
   */
  extractMethodology(content) {
    try {
      // Tenta extrair a seção de metodologia usando expressões regulares
      // Suporta tanto o formato antigo quanto o novo formato
      const methodologyMatch = content.match(
        /(?:METODOLOGIA|2\.\s*METODOLOGIA|Metodologia)[:\s]+(.*?)(?=\n\s*(?:\d+\.|[A-Z][a-zçãõáéíóúâêîôûàèìòù]+:|Achados:|Conclusão:))/is
      );
      return methodologyMatch
        ? methodologyMatch[1].trim()
        : "Metodologia não especificada";
    } catch (error) {
      console.error("Erro ao extrair metodologia:", error);
      return "Metodologia não especificada";
    }
  }

  /**
   * Extrai a conclusão do conteúdo gerado pelo LLM
   * @param {String} content - Conteúdo completo gerado
   * @returns {String} Seção de conclusão extraída
   */
  extractConclusion(content) {
    try {
      // Tenta extrair a seção de conclusão usando expressões regulares
      // Suporta tanto o formato antigo quanto o novo formato
      const conclusionMatch = content.match(
        /(?:CONCLUSÃO|5\.\s*CONCLUSÃO|Conclusão)[:\s]+(.*?)(?=$|\n\s*(?:\d+\.|[A-Z][a-zçãõáéíóúâêîôûàèìòù]+:))/is
      );
      return conclusionMatch
        ? conclusionMatch[1].trim()
        : "Conclusão não especificada";
    } catch (error) {
      console.error("Erro ao extrair conclusão:", error);
      return "Conclusão não especificada";
    }
  }

  /**
   * Extrai os achados do conteúdo gerado pelo LLM (específico para relatórios de evidência)
   * @param {String} content - Conteúdo completo gerado
   * @returns {String} Seção de achados extraída
   */
  extractFindings(content) {
    try {
      // Tenta extrair a seção de achados usando expressões regulares
      // Suporta tanto o formato antigo quanto o novo formato
      const findingsMatch = content.match(
        /(?:ACHADOS|3\.\s*ACHADOS|Achados)[:\s]+(.*?)(?=\n\s*(?:\d+\.|[A-Z][a-zçãõáéíóúâêîôûàèìòù]+:|Conclusão:))/is
      );
      return findingsMatch
        ? findingsMatch[1].trim()
        : "Achados não especificados";
    } catch (error) {
      console.error("Erro ao extrair achados:", error);
      return "Achados não especificados";
    }
  }

  /**
   * Extrai o título do conteúdo gerado pelo LLM
   * @param {String} content - Conteúdo completo gerado
   * @returns {String} Título extraído
   */
  extractTitle(content) {
    try {
      // Tenta extrair o título usando expressões regulares
      // Procura por padrões como "Título:" ou um título no início do documento
      const titleMatch = content.match(
        /(?:TÍTULO|Título|1\.\s*TÍTULO)[:\s]+(.*?)(?=\n\s*(?:\d+\.|[A-Z][a-zçãõáéíóúâêîôûàèìòù]+:|Metodologia:))/is
      );

      // Se não encontrar com o padrão acima, tenta encontrar a primeira linha como título
      if (!titleMatch) {
        const firstLineMatch = content.match(/^\s*(.+?)\s*(?=\n)/s);
        return firstLineMatch
          ? firstLineMatch[1].trim()
          : "Relatório de Análise Forense";
      }

      return titleMatch[1].trim();
    } catch (error) {
      console.error("Erro ao extrair título:", error);
      return "Relatório de Análise Forense";
    }
  }
}

export default new LLMService();
