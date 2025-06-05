import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Opções básicas do Swagger
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Gestão Odontológica Forense",
      version: "1.1.0",
      description:
        "API para gerenciamento de casos, evidências, laudos e pacientes em odontologia forense, com suporte a geração de conteúdo por IA",
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
              description:
                "Código de referência (para pacientes não identificados)",
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
        Victim: {
          type: "object",
          required: ["identificationType", "createdBy"],
          properties: {
            id: {
              type: "string",
              description: "ID da vítima gerado automaticamente",
            },
            nic: {
              type: "string",
              description: "Número de Identificação Criminal (NIC)",
            },
            name: {
              type: "string",
              description:
                "Nome completo da vítima (para vítimas identificadas)",
            },
            gender: {
              type: "string",
              enum: ["masculino", "feminino", "indeterminado"],
              description: "Gênero da vítima",
            },
            age: {
              type: "number",
              description: "Idade da vítima",
            },
            birthDate: {
              type: "string",
              format: "date",
              description: "Data de nascimento da vítima",
            },
            estimatedAge: {
              type: "object",
              properties: {
                min: { type: "number" },
                max: { type: "number" },
                methodology: { type: "string" },
              },
              description: "Idade estimada da vítima",
            },
            document: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: [
                    "cpf",
                    "rg",
                    "cnh",
                    "passaporte",
                    "certidao_nascimento",
                    "outro",
                  ],
                },
                number: { type: "string" },
                issuer: { type: "string" },
                issueDate: { type: "string", format: "date" },
              },
              description: "Documento de identificação da vítima",
            },
            address: {
              type: "object",
              properties: {
                street: { type: "string" },
                number: { type: "string" },
                complement: { type: "string" },
                neighborhood: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                zipCode: { type: "string" },
                country: { type: "string" },
              },
              description: "Endereço da vítima",
            },
            ethnicity: {
              type: "string",
              enum: [
                "branca",
                "preta",
                "parda",
                "amarela",
                "indígena",
                "não_declarada",
                "não_identificada",
              ],
              description: "Cor/Etnia da vítima",
            },
            identificationType: {
              type: "string",
              enum: ["identificada", "não_identificada"],
              description: "Tipo de identificação da vítima",
            },
            referenceCode: {
              type: "string",
              description:
                "Código de referência (para vítimas não identificadas)",
            },
            nationality: {
              type: "string",
              description: "Nacionalidade da vítima",
            },
            locationDate: {
              type: "string",
              format: "date-time",
              description: "Data de localização do corpo",
            },
            locationPlace: {
              type: "string",
              description: "Local de encontro do corpo",
            },
            bodyCondition: {
              type: "string",
              enum: [
                "íntegro",
                "decomposição_inicial",
                "decomposição_avançada",
                "esqueletizado",
                "parcialmente_esqueletizado",
                "carbonizado",
                "mumificado",
                "fragmentado",
              ],
              description: "Condição do corpo",
            },
            probableCauseOfDeath: {
              type: "string",
              description: "Causa provável da morte",
            },
            odontogram: {
              type: "object",
              description: "Odontograma da vítima",
              // Detalhes do odontograma podem ser adicionados aqui se necessário
            },
            anatomicalRegions: {
              type: "array",
              items: {
                type: "object", // Definir a estrutura de anatomicalRegionSchema
              },
              description: "Anotações de regiões anatômicas",
            },
            dentalFeatures: {
              type: "array",
              items: {
                type: "object", // Definir a estrutura de dentalFeatures
              },
              description: "Características odontológicas específicas",
            },
            antemortemRecords: {
              type: "array",
              items: {
                type: "object", // Definir a estrutura de antemortemRecords
              },
              description: "Documentação ante-mortem",
            },
            identificationMethods: {
              type: "array",
              items: {
                type: "object", // Definir a estrutura de identificationMethods
              },
              description: "Métodos de identificação aplicados",
            },
            cases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  caseId: {
                    type: "string",
                    description: "ID do caso relacionado",
                  },
                  relationType: {
                    type: "string",
                    enum: ["principal", "secundária", "outro"],
                  },
                  notes: { type: "string" },
                },
              },
              description: "Casos relacionados à vítima",
            },
            evidences: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  evidenceId: {
                    type: "string",
                    description: "ID da evidência relacionada",
                  },
                  relationType: {
                    type: "string",
                    enum: ["direta", "indireta", "contextual"],
                  },
                  notes: { type: "string" },
                },
              },
              description: "Evidências relacionadas à vítima",
            },
            createdBy: {
              type: "string",
              description: "ID do usuário que criou o registro da vítima",
            },
            updatedBy: {
              type: "string",
              description: "ID do usuário que atualizou o registro da vítima",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Data de criação do registro",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Data da última atualização do registro",
            },
          },
        },
        EvidenceReport: {
          type: "object",
          required: [
            "title",
            "content",
            "evidence",
            "findings",
            "expertResponsible",
          ],
          properties: {
            id: {
              type: "string",
              description:
                "ID do relatório de evidência gerado automaticamente",
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
  paths: {
    // Definições de rotas para Victim aqui
    "/api/victims": {
      get: {
        tags: ["Victim"],
        summary: "Obter todas as vítimas",
        description:
          "Retorna uma lista de todas as vítimas, com opções de paginação e filtro.",
        parameters: [
          {
            name: "select",
            in: "query",
            description: "Campos para selecionar (separados por vírgula)",
            schema: { type: "string" },
          },
          {
            name: "sort",
            in: "query",
            description: "Campo para ordenar",
            schema: { type: "string" },
          },
          {
            name: "page",
            in: "query",
            description: "Número da página",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            description: "Número de itens por página",
            schema: { type: "integer", default: 25 },
          },
        ],
        responses: {
          200: {
            description: "Lista de vítimas obtida com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    count: { type: "integer" },
                    pagination: { type: "object" }, // Adicionar detalhes da paginação se necessário
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Victim" },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
        },
      },
      post: {
        tags: ["Victim"],
        summary: "Criar nova vítima",
        description: "Cria um novo registro de vítima no sistema.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Victim" },
            },
          },
        },
        responses: {
          201: {
            description: "Vítima criada com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/Victim" },
                  },
                },
              },
            },
          },
          400: { description: "Dados inválidos" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
        },
      },
    },
    "/api/victims/{id}": {
      get: {
        tags: ["Victim"],
        summary: "Obter uma vítima específica",
        description: "Retorna os detalhes de uma vítima específica pelo ID.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Detalhes da vítima obtidos com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/Victim" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
      put: {
        tags: ["Victim"],
        summary: "Atualizar vítima",
        description: "Atualiza os dados de uma vítima existente.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima a ser atualizada",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Victim" },
            },
          },
        },
        responses: {
          200: {
            description: "Vítima atualizada com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/Victim" },
                  },
                },
              },
            },
          },
          400: { description: "Dados inválidos" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
      delete: {
        tags: ["Victim"],
        summary: "Excluir vítima",
        description: "Exclui uma vítima do sistema.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima a ser excluída",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Vítima excluída com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "object" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
    // Adicionar outras rotas específicas de Victim aqui, como:
    // - /api/victims/search/odontogram
    // - /api/victims/{id}/cases
    // - /api/victims/{id}/cases/{caseId}
    // - /api/victims/{id}/evidences
    // - /api/victims/{id}/evidences/{evidenceId}
    // - /api/victims/{id}/odontogram/{toothNumber}
    // - /api/victims/{id}/dental-features
    // - /api/victims/{id}/anatomical-regions
    // - /api/victims/{id}/anatomical-regions/{regionId}
    "/api/victims/search/odontogram": {
      post: {
        tags: ["Victim"],
        summary: "Buscar vítimas por características odontológicas",
        description:
          "Busca vítimas com base em um conjunto de características odontológicas.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  features: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        toothNumber: { type: "string" },
                        status: { type: "string" },
                        rootCanal: { type: "boolean" },
                        crown: { type: "string" },
                      },
                    },
                  },
                  matchAll: { type: "boolean", default: false },
                  page: { type: "integer", default: 1 },
                  limit: { type: "integer", default: 25 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Busca realizada com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    count: { type: "integer" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Victim" },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Dados de busca inválidos" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
        },
      },
    },
    "/api/victims/{id}/cases": {
      post: {
        tags: ["Victim"],
        summary: "Vincular vítima a um caso",
        description: "Adiciona um vínculo entre uma vítima e um caso forense.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  caseId: {
                    type: "string",
                    description: "ID do caso a ser vinculado",
                  },
                  relationType: {
                    type: "string",
                    enum: ["principal", "secundária", "outro"],
                    default: "principal",
                  },
                  notes: {
                    type: "string",
                    description: "Notas sobre a relação",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Caso vinculado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Victim" },
              },
            },
          },
          400: { description: "Dados inválidos" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
    "/api/victims/{id}/cases/{caseId}": {
      delete: {
        tags: ["Victim"],
        summary: "Remover vínculo de vítima com um caso",
        description: "Remove o vínculo entre uma vítima e um caso forense.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima",
            schema: { type: "string" },
          },
          {
            name: "caseId",
            in: "path",
            required: true,
            description: "ID do caso a ser desvinculado",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Vínculo com caso removido com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Victim" },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
    "/api/victims/{id}/evidences": {
      post: {
        tags: ["Victim"],
        summary: "Vincular vítima a uma evidência",
        description: "Adiciona um vínculo entre uma vítima e uma evidência.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  evidenceId: {
                    type: "string",
                    description: "ID da evidência a ser vinculada",
                  },
                  relationType: {
                    type: "string",
                    enum: ["direta", "indireta", "contextual"],
                    default: "direta",
                  },
                  notes: {
                    type: "string",
                    description: "Notas sobre a relação",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Evidência vinculada com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Victim" },
              },
            },
          },
          400: { description: "Dados inválidos" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
    "/api/victims/{id}/evidences/{evidenceId}": {
      delete: {
        tags: ["Victim"],
        summary: "Remover vínculo de vítima com uma evidência",
        description: "Remove o vínculo entre uma vítima e uma evidência.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima",
            schema: { type: "string" },
          },
          {
            name: "evidenceId",
            in: "path",
            required: true,
            description: "ID da evidência a ser desvinculada",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Vínculo com evidência removido com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Victim" },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
    "/api/victims/{id}/odontogram/{toothNumber}": {
      put: {
        tags: ["Victim"],
        summary: "Atualizar dente no odontograma",
        description:
          "Atualiza as informações de um dente específico no odontograma da vítima.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima",
            schema: { type: "string" },
          },
          {
            name: "toothNumber",
            in: "path",
            required: true,
            description: "Número do dente (notação FDI)",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" }, // Definir o schema para os dados do dente (toothSchema)
            },
          },
        },
        responses: {
          200: {
            description: "Dente atualizado com sucesso",
            content: { "application/json": { schema: { type: "object" } } },
          }, // Retornar o dente atualizado
          400: { description: "Dados inválidos ou número do dente inválido" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
    "/api/victims/{id}/dental-features": {
      post: {
        tags: ["Victim"],
        summary: "Adicionar característica odontológica",
        description: "Adiciona uma nova característica odontológica à vítima.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: [
                      "prótese",
                      "implante",
                      "ortodôntico",
                      "endodôntico",
                      "anomalia",
                      "patologia",
                      "característica_única",
                      "outro",
                    ],
                  },
                  description: { type: "string" },
                  location: { type: "string" },
                  identificationValue: {
                    type: "string",
                    enum: ["baixo", "médio", "alto"],
                    default: "médio",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Característica odontológica adicionada com sucesso",
            content: { "application/json": { schema: { type: "object" } } },
          }, // Retornar a característica adicionada
          400: { description: "Dados inválidos" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
    "/api/victims/{id}/anatomical-regions": {
      post: {
        tags: ["Victim"],
        summary: "Adicionar anotação de região anatômica",
        description:
          "Adiciona uma nova anotação de região anatômica para a vítima.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  region: {
                    type: "string",
                    enum: [
                      "crânio",
                      "face",
                      "mandíbula",
                      "maxila",
                      "articulação_temporomandibular",
                      "seios_paranasais",
                      "cavidade_oral",
                      "língua",
                      "palato",
                      "gengiva",
                      "mucosa_oral",
                      "glândulas_salivares",
                      "músculos_faciais",
                      "nervos_faciais",
                      "vasos_sanguíneos",
                      "linfonodos",
                      "outro",
                    ],
                  },
                  description: { type: "string" },
                  findings: { type: "string" },
                  pathologies: { type: "string" },
                  annotations: { type: "string" },
                  images: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        url: { type: "string" },
                        description: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Região anatômica adicionada com sucesso",
            content: { "application/json": { schema: { type: "object" } } },
          }, // Retornar a região adicionada
          400: { description: "Dados inválidos" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
      get: {
        tags: ["Victim"],
        summary: "Obter anotações de regiões anatômicas de uma vítima",
        description:
          "Retorna todas as anotações de regiões anatômicas para uma vítima específica.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Lista de regiões anatômicas obtida com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    count: { type: "integer" },
                    data: { type: "array", items: { type: "object" } }, // Definir o schema para anatomicalRegionSchema
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
    "/api/victims/{id}/anatomical-regions/{regionId}": {
      put: {
        tags: ["Victim"],
        summary: "Atualizar anotação de região anatômica",
        description:
          "Atualiza uma anotação de região anatômica existente para a vítima.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima",
            schema: { type: "string" },
          },
          {
            name: "regionId",
            in: "path",
            required: true,
            description: "ID da região anatômica",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" }, // Definir o schema para os dados da região anatômica
            },
          },
        },
        responses: {
          200: {
            description: "Região anatômica atualizada com sucesso",
            content: { "application/json": { schema: { type: "object" } } },
          }, // Retornar a região atualizada
          400: { description: "Dados inválidos" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
      delete: {
        tags: ["Victim"],
        summary: "Remover anotação de região anatômica",
        description: "Remove uma anotação de região anatômica da vítima.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima",
            schema: { type: "string" },
          },
          {
            name: "regionId",
            in: "path",
            required: true,
            description: "ID da região anatômica a ser removida",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Região anatômica removida com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "object" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
    "/api/victims/{id}/odontogram/annotations": {
      put: {
        tags: ["Victim"],
        summary: "Atualizar anotações do odontograma",
        description:
          "Atualiza as anotações gerais e específicas do odontograma da vítima.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "ID da vítima",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  generalNotes: { type: "string" },
                  annotations: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Anotações do odontograma atualizadas com sucesso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        generalNotes: { type: "string" },
                        annotations: { type: "string" },
                        lastUpdate: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: "Dados inválidos" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../controllers/*.js"),
    path.join(__dirname, "../models/*.js"),
  ],
};

// Inicializar swagger-jsdoc
const specs = swaggerJsdoc(options);

// Função para configurar o Swagger no app Express
const setupSwagger = (app) => {
  // Configurações da UI do Swagger
  const swaggerUiOptions = {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "API Odontologia Forense - Documentação",
  };

  // Configurar rotas do Swagger
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, swaggerUiOptions)
  );
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });

  console.log("Swagger documentation available at /api-docs");
};

export default setupSwagger;
