import swaggerJsdoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import { fileURLToPath } from "url"
import path from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Opções básicas do Swagger
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Gestão Odontológica Forense",
      version: "1.0.0",
      description: "API para gerenciamento de casos, evidências, laudos e pacientes em odontologia forense",
      contact: {
        name: "Equipe de Desenvolvimento",
        email: "contato@exemplo.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Servidor de Desenvolvimento",
      },
      {
        url: "https://perioscan-back-end.onrender.com",
        description: "Servidor de Produção",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            id: {
              type: "string",
              description: "ID do usuário gerado automaticamente",
            },
            name: {
              type: "string",
              description: "Nome do usuário",
            },
            email: {
              type: "string",
              description: "Email do usuário",
              format: "email",
            },
            password: {
              type: "string",
              description: "Senha do usuário (não retornada nas consultas)",
              format: "password",
            },
            role: {
              type: "string",
              description: "Função do usuário no sistema",
              enum: ["admin", "perito", "assistente"],
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Data de criação do usuário",
            },
          },
        },
        Case: {
          type: "object",
          required: ["title", "description", "location"],
          properties: {
            id: {
              type: "string",
              description: "ID do caso gerado automaticamente",
            },
            title: {
              type: "string",
              description: "Título do caso",
            },
            description: {
              type: "string",
              description: "Descrição detalhada do caso",
            },
            location: {
              type: "string",
              description: "Local do ocorrido",
            },
            status: {
              type: "string",
              description: "Status atual do caso",
              enum: ["em andamento", "finalizado", "arquivado"],
            },
            openDate: {
              type: "string",
              format: "date-time",
              description: "Data de abertura do caso",
            },
            closeDate: {
              type: "string",
              format: "date-time",
              description: "Data de fechamento do caso",
            },
            createdBy: {
              type: "string",
              description: "ID do usuário que criou o caso",
            },
          },
        },
        Evidence: {
          type: "object",
          required: ["type", "case", "collectedBy"],
          properties: {
            id: {
              type: "string",
              description: "ID da evidência gerado automaticamente",
            },
            type: {
              type: "string",
              description: "Tipo de evidência",
              enum: ["image", "text"],
            },
            collectionDate: {
              type: "string",
              format: "date-time",
              description: "Data de coleta da evidência",
            },
            collectedBy: {
              type: "string",
              description: "ID do usuário que coletou a evidência",
            },
            case: {
              type: "string",
              description: "ID do caso ao qual a evidência pertence",
            },
            description: {
              type: "string",
              description: "Descrição da evidência",
            },
            imageUrl: {
              type: "string",
              description: "URL da imagem (para evidências do tipo image)",
            },
            content: {
              type: "string",
              description: "Conteúdo textual (para evidências do tipo text)",
            },
            
          },
        },
        Report: {
          type: "object",
          required: ["title", "content", "case", "expertResponsible"],
          properties: {
            id: {
              type: "string",
              description: "ID do laudo gerado automaticamente",
            },
            title: {
              type: "string",
              description: "Título do laudo",
            },
            content: {
              type: "string",
              description: "Conteúdo principal do laudo",
            },
            case: {
              type: "string",
              description: "ID do caso ao qual o laudo pertence",
            },
            expertResponsible: {
              type: "string",
              description: "ID do perito responsável pelo laudo",
            },
            status: {
              type: "string",
              description: "Status atual do laudo",
              enum: ["rascunho", "finalizado", "assinado"],
            },
            digitalSignature: {
              type: "object",
              properties: {
                signedBy: {
                  type: "string",
                  description: "ID do usuário que assinou o laudo",
                },
                signatureDate: {
                  type: "string",
                  format: "date-time",
                  description: "Data e hora da assinatura",
                },
                signatureData: {
                  type: "string",
                  description: "Dados da assinatura digital",
                },
                contentHash: {
                  type: "string",
                  description: "Hash do conteúdo do documento",
                },
                verificationCode: {
                  type: "string",
                  description: "Código de verificação da assinatura",
                },
              },
            },
            conclusion: {
              type: "string",
              description: "Conclusão do laudo",
            },
            methodology: {
              type: "string",
              description: "Metodologia utilizada na análise",
            },
          },
        },
        Patient: {
          type: "object",
          required: ["patientType", "createdBy"],
          properties: {
            id: {
              type: "string",
              description: "ID do paciente gerado automaticamente",
            },
            patientType: {
              type: "string",
              description: "Tipo de paciente",
              enum: ["identified", "unidentified"],
            },
            name: {
              type: "string",
              description: "Nome do paciente (para pacientes identificados)",
            },
            birthDate: {
              type: "string",
              format: "date",
              description: "Data de nascimento (para pacientes identificados)",
            },
            gender: {
              type: "string",
              description: "Gênero do paciente",
              enum: ["masculino", "feminino", "outro", "não informado"],
            },
            cpf: {
              type: "string",
              description: "CPF do paciente (para pacientes identificados)",
            },
            referenceCode: {
              type: "string",
              description: "Código de referência (para pacientes não identificados)",
            },
            status: {
              type: "string",
              description: "Status do paciente",
              enum: ["ativo", "arquivado", "identificado", "pendente"],
            },
            dentalFeatures: {
              type: "array",
              description: "Características odontológicas do paciente",
              items: {
                type: "object",
                properties: {
                  toothNumber: {
                    type: "string",
                    description: "Número do dente (notação FDI)",
                  },
                  description: {
                    type: "string",
                    description: "Descrição da característica",
                  },
                  type: {
                    type: "string",
                    description: "Tipo de característica",
                    enum: [
                      "restauração",
                      "ausência",
                      "prótese",
                      "implante",
                      "tratamento endodôntico",
                      "anomalia",
                      "outro",
                    ],
                  },
                },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Descrição do erro",
            },
          },
        },
        EvidenceReport: {
          type: "object",
          required: ["title", "content", "evidence", "findings", "expertResponsible"],
          properties: {
            id: {
              type: "string",
              description: "ID do relatório de evidência gerado automaticamente",
            },
            title: {
              type: "string",
              description: "Título do relatório de evidência",
            },
            content: {
              type: "string",
              description: "Conteúdo principal do relatório de evidência",
            },
            evidence: {
              type: "string",
              description: "ID da evidência analisada",
            },
            case: {
              type: "string",
              description: "ID do caso ao qual a evidência pertence",
            },
            expertResponsible: {
              type: "string",
              description: "ID do perito responsável pelo relatório",
            },
            findings: {
              type: "string",
              description: "Descobertas da análise da evidência",
            },
            status: {
              type: "string",
              description: "Status atual do relatório",
              enum: ["rascunho", "finalizado", "assinado"],
            },
            methodology: {
              type: "string",
              description: "Metodologia utilizada na análise",
            },
            conclusion: {
              type: "string",
              description: "Conclusão do relatório",
            },
            digitalSignature: {
              type: "object",
              properties: {
                signedBy: {
                  type: "string",
                  description: "ID do usuário que assinou o relatório",
                },
                signatureDate: {
                  type: "string",
                  format: "date-time",
                  description: "Data e hora da assinatura",
                },
                signatureData: {
                  type: "string",
                  description: "Dados da assinatura digital",
                },
                contentHash: {
                  type: "string",
                  description: "Hash do conteúdo do documento",
                },
                verificationCode: {
                  type: "string",
                  description: "Código de verificação da assinatura",
                },
              },
            },
            evidenceMetadata: {
              type: "object",
              description: "Metadados específicos do tipo de evidência",
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Token de autenticação não fornecido ou inválido",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                message: "Not authorized to access this route",
              },
            },
          },
        },
        NotFoundError: {
          description: "Recurso não encontrado",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                message: "Resource not found",
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../controllers/*.js"),
    path.join(__dirname, "../models/*.js"),
  ],
}

// Inicializar swagger-jsdoc
const specs = swaggerJsdoc(options)

// Função para configurar o Swagger no app Express
const setupSwagger = (app) => {
  // Configurações da UI do Swagger
  const swaggerUiOptions = {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "API Odontologia Forense - Documentação",
  }

  // Configurar rotas do Swagger
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions))
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json")
    res.send(specs)
  })

  console.log("Swagger documentation available at /api-docs")
}

export default setupSwagger
