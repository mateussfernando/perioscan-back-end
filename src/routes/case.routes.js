import express from "express";
import {
  getCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
} from "../controllers/case.controller.js";
import { getCaseEvidence } from "../controllers/evidence.controller.js";
import { getCaseReports } from "../controllers/report.controller.js";
// Removida dependência do comparison.controller.js
import { getCasePatients } from "../controllers/patient.controller.js";
import Case from "../models/case.model.js";
import advancedResults from "../middleware/advancedResults.middleware.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Casos
 *   description: Gerenciamento de casos forenses
 */

/**
 * @swagger
 * /api/cases:
 *   get:
 *     summary: Obter todos os casos
 *     description: Retorna uma lista paginada de casos. Usuários não-admin só veem casos criados por eles.
 *     tags: [Casos]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [em andamento, finalizado, arquivado]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de casos
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
 *                     $ref: '#/components/schemas/Case'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Criar um novo caso
 *     description: Cria um novo caso forense. Requer permissão de admin ou perito.
 *     tags: [Casos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título do caso
 *               description:
 *                 type: string
 *                 description: Descrição detalhada do caso
 *               location:
 *                 type: string
 *                 description: Local do ocorrido
 *               occurrenceDate:
 *                 type: string
 *                 format: date-time
 *                 description: Data em que o ocorrido aconteceu
 *               status:
 *                 type: string
 *                 enum: [em andamento, finalizado, arquivado]
 *                 default: em andamento
 *                 description: Status inicial do caso
 *     responses:
 *       201:
 *         description: Caso criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para criar casos
 */
router
  .route("/")
  .get(
    advancedResults(Case, [{ path: "createdBy", select: "name email" }]),
    getCases
  )
  .post(authorize("admin", "perito"), createCase);

/**
 * @swagger
 * /api/cases/{id}:
 *   get:
 *     summary: Obter um caso específico
 *     description: Retorna os detalhes de um caso específico pelo ID
 *     tags: [Casos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caso
 *     responses:
 *       200:
 *         description: Detalhes do caso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para acessar este caso
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Atualizar um caso
 *     description: Atualiza os detalhes de um caso existente
 *     tags: [Casos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [em andamento, finalizado, arquivado]
 *               location:
 *                 type: string
 *                 description: Local do ocorrido
 *     responses:
 *       200:
 *         description: Caso atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Case'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para atualizar este caso
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Excluir um caso
 *     description: Remove um caso existente
 *     tags: [Casos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caso
 *     responses:
 *       200:
 *         description: Caso excluído com sucesso
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
 *         description: Sem permissão para excluir este caso
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router
  .route("/:id")
  .get(getCase)
  .put(authorize("admin", "perito", "assistente"), updateCase)
  .delete(authorize("admin", "perito"), deleteCase);

/**
 * @swagger
 * /api/cases/{caseId}/evidence:
 *   get:
 *     summary: Obter evidências de um caso
 *     description: Retorna todas as evidências associadas a um caso específico
 *     tags: [Casos, Evidências]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caso
 *     responses:
 *       200:
 *         description: Lista de evidências do caso
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Evidence'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para acessar este caso
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route("/:caseId/evidence").get(getCaseEvidence);

/**
 * @swagger
 * /api/cases/{caseId}/reports:
 *   get:
 *     summary: Obter laudos de um caso
 *     description: Retorna todos os laudos associados a um caso específico
 *     tags: [Casos, Laudos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caso
 *     responses:
 *       200:
 *         description: Lista de laudos do caso
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Report'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para acessar este caso
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route("/:caseId/reports").get(getCaseReports);

/**
 * @swagger
 * /api/cases/{caseId}/comparisons:
 *   get:
 *     summary: Obter comparações de um caso
 *     description: Retorna todas as comparações associadas a um caso específico
 *     tags: [Casos, Comparações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caso
 *     responses:
 *       200:
 *         description: Lista de comparações do caso
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para acessar este caso
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
// Rota de comparações removida temporariamente
// router.route("/:caseId/comparisons").get(getCaseComparisons)

/**
 * @swagger
 * /api/cases/{caseId}/patients:
 *   get:
 *     summary: Obter pacientes de um caso
 *     description: Retorna todos os pacientes associados a um caso específico
 *     tags: [Casos, Pacientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do caso
 *     responses:
 *       200:
 *         description: Lista de pacientes do caso
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para acessar este caso
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route("/:caseId/patients").get(getCasePatients);

export default router;
