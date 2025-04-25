// src/routes/patient.routes.js

/**
 * @swagger
 * tags:
 *   name: Pacientes
 *   description: Gerenciamento de pacientes e suas características odontológicas
 */

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Listar todos os pacientes
 *     description: Retorna uma lista paginada de pacientes
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página a ser retornada
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Número de itens por página
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Campo para ordenação (ex. -createdAt para ordem decrescente)
 *       - in: query
 *         name: patientType
 *         schema:
 *           type: string
 *           enum: [identificado, não identificado]
 *         description: Filtrar por tipo de paciente
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ativo, arquivado, identificado, pendente]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de pacientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Criar um novo paciente
 *     description: Cria um novo paciente no sistema
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientType
 *             properties:
 *               patientType:
 *                 type: string
 *                 enum: [identificado, não identificado]
 *                 description: Tipo de paciente
 *               name:
 *                 type: string
 *                 description: Nome do paciente (obrigatório para pacientes identificados)
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 description: Data de nascimento
 *               gender:
 *                 type: string
 *                 enum: [masculino, feminino, outro, não informado]
 *                 description: Gênero do paciente
 *               cpf:
 *                 type: string
 *                 description: CPF do paciente (para pacientes identificados)
 *               referenceCode:
 *                 type: string
 *                 description: Código de referência (obrigatório para pacientes não identificados)
 *               estimatedAge:
 *                 type: string
 *                 description: Faixa etária estimada (para pacientes não identificados)
 *               estimatedGender:
 *                 type: string
 *                 enum: [masculino, feminino, indeterminado]
 *                 description: Gênero estimado (para pacientes não identificados)
 *               foundLocation:
 *                 type: string
 *                 description: Local onde o paciente foi encontrado (para pacientes não identificados)
 *               foundDate:
 *                 type: string
 *                 format: date
 *                 description: Data em que o paciente foi encontrado (para pacientes não identificados)
 *               caseId:
 *                 type: string
 *                 description: ID do caso a ser vinculado ao paciente
 *               relationshipType:
 *                 type: string
 *                 enum: [vítima, suspeito, referência, outro]
 *                 description: Tipo de relação com o caso
 *               caseNotes:
 *                 type: string
 *                 description: Observações sobre a relação com o caso
 *     responses:
 *       201:
 *         description: Paciente criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para criar pacientes
 */

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Obter um paciente específico
 *     description: Retorna os detalhes de um paciente pelo ID
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do paciente
 *     responses:
 *       200:
 *         description: Detalhes do paciente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Atualizar um paciente
 *     description: Atualiza os detalhes de um paciente existente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               birthDate:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [masculino, feminino, outro, não informado]
 *               cpf:
 *                 type: string
 *               referenceCode:
 *                 type: string
 *               estimatedAge:
 *                 type: string
 *               estimatedGender:
 *                 type: string
 *                 enum: [masculino, feminino, indeterminado]
 *               foundLocation:
 *                 type: string
 *               foundDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [ativo, arquivado, identificado, pendente]
 *     responses:
 *       200:
 *         description: Paciente atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para atualizar este paciente
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Excluir um paciente
 *     description: Remove um paciente existente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do paciente
 *     responses:
 *       200:
 *         description: Paciente excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   example: {}
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para excluir este paciente
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/patients/{id}/cases:
 *   post:
 *     summary: Vincular paciente a um caso
 *     description: Adiciona um vínculo entre um paciente e um caso
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - caseId
 *             properties:
 *               caseId:
 *                 type: string
 *                 description: ID do caso a ser vinculado
 *               relationshipType:
 *                 type: string
 *                 enum: [vítima, suspeito, referência, outro]
 *                 default: outro
 *                 description: Tipo de relação com o caso
 *               notes:
 *                 type: string
 *                 description: Observações sobre a relação
 *     responses:
 *       200:
 *         description: Caso vinculado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para vincular este paciente
 *       404:
 *         description: Paciente ou caso não encontrado
 */

/**
 * @swagger
 * /api/patients/{id}/cases/{caseId}:
 *   delete:
 *     summary: Remover vínculo de paciente com um caso
 *     description: Remove o vínculo entre um paciente e um caso
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do paciente
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caso
 *     responses:
 *       200:
 *         description: Vínculo removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para desvincular este paciente
 *       404:
 *         description: Paciente, caso ou vínculo não encontrado
 */

/**
 * @swagger
 * /api/patients/{id}/dental-features:
 *   post:
 *     summary: Adicionar característica odontológica
 *     description: Adiciona uma nova característica odontológica a um paciente
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toothNumber
 *               - description
 *               - type
 *             properties:
 *               toothNumber:
 *                 type: string
 *                 description: Número do dente (notação FDI)
 *               description:
 *                 type: string
 *                 description: Descrição da característica
 *               type:
 *                 type: string
 *                 enum: [restauração, ausência, prótese, implante, tratamento endodôntico, anomalia, outro]
 *                 description: Tipo de característica
 *               notes:
 *                 type: string
 *                 description: Observações adicionais
 *     responses:
 *       200:
 *         description: Característica adicionada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para modificar este paciente
 *       404:
 *         description: Paciente não encontrado
 */

/**
 * @swagger
 * /api/patients/search/dental:
 *   post:
 *     summary: Buscar pacientes por características odontológicas
 *     description: Realiza uma busca de pacientes com base em características odontológicas específicas
 *     tags: [Pacientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - features
 *             properties:
 *               features:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     toothNumber:
 *                       type: string
 *                       description: Número do dente (notação FDI)
 *                     type:
 *                       type: string
 *                       enum: [restauração, ausência, prótese, implante, tratamento endodôntico, anomalia, outro]
 *                       description: Tipo de característica
 *               matchAll:
 *                 type: boolean
 *                 default: false
 *                 description: Se verdadeiro, busca pacientes que possuem todas as características (AND). Se falso, busca pacientes que possuem pelo menos uma característica (OR).
 *               page:
 *                 type: integer
 *                 default: 1
 *                 description: Página a ser retornada
 *               limit:
 *                 type: integer
 *                 default: 25
 *                 description: Número de itens por página
 *     responses:
 *       200:
 *         description: Resultados da busca
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       patientType:
 *                         type: string
 *                       name:
 *                         type: string
 *                       referenceCode:
 *                         type: string
 *                       matchScore:
 *                         type: number
 *                       matchPercentage:
 *                         type: number
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

import express from "express"
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  addCaseToPatient,
  removeCaseFromPatient,
  addDentalFeature,
  searchByDentalFeatures,
} from "../controllers/patient.controller.js"
import Patient from "../models/patient.model.js"
import advancedResults from "../middleware/advancedResults.middleware.js"
import { protect, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

router.use(protect)

// Rota para busca por características odontológicas
router.post("/search/dental", searchByDentalFeatures)

// Rotas principais
router
  .route("/")
  .get(
    advancedResults(Patient, [
      { path: "createdBy", select: "name email" },
      { path: "cases.caseId", select: "title status" },
    ]),
    getPatients,
  )
  .post(authorize("admin", "perito"), createPatient)

router
  .route("/:id")
  .get(getPatient)
  .put(authorize("admin", "perito"), updatePatient)
  .delete(authorize("admin", "perito"), deletePatient)

// Rotas para vincular/desvincular casos
router.route("/:id/cases").post(authorize("admin", "perito"), addCaseToPatient)

router.route("/:id/cases/:caseId").delete(authorize("admin", "perito"), removeCaseFromPatient)

// Rota para adicionar características odontológicas
router.route("/:id/dental-features").post(authorize("admin", "perito"), addDentalFeature)

export default router

