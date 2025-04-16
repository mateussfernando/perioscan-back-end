/**
 * @swagger
 * tags:
 *   name: Evidence
 *   description: Gestão de evidências forenses
 */

/**
 * @swagger
 * /api/evidence:
 *   get:
 *     summary: Listar todas as evidências
 *     tags: [Evidence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [image, text]
 *         description: 'Filtrar por tipo de evidência'
 *       - in: query
 *         name: case
 *         schema:
 *           type: string
 *         description: 'Filtrar por ID do caso'
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: 'Ordenação (ex: "createdAt:asc")'
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *         description: 'Campos a serem selecionados (ex: "type,case")'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 'Limite de resultados'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 'Número da página'
 *     responses:
 *       200:
 *         description: Lista de evidências
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Evidence'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/evidence/{id}:
 *   get:
 *     summary: Obter detalhes de uma evidência
 *     tags: [Evidence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 'ID da evidência'
 *     responses:
 *       200:
 *         description: Detalhes da evidência
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evidence'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 'Acesso não autorizado'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/evidence:
 *   post:
 *     summary: Criar nova evidência
 *     tags: [Evidence]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - case
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [image, text]
 *               case:
 *                 type: string
 *                 description: 'ID do caso relacionado'
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 description: 'URL da imagem (para tipo image)'
 *               content:
 *                 type: string
 *                 description: 'Conteúdo textual (para tipo text)'
 *     responses:
 *       201:
 *         description: Evidência criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evidence'
 *       400:
 *         description: 'Erro de validação'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/evidence/{id}:
 *   put:
 *     summary: Atualizar evidência
 *     tags: [Evidence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 'ID da evidência'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evidência atualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Evidence'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 'Acesso não autorizado'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/evidence/{id}:
 *   delete:
 *     summary: Excluir evidência
 *     tags: [Evidence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 'ID da evidência'
 *     responses:
 *       200:
 *         description: Evidência excluída
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: 'Acesso não autorizado'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/cases/{caseId}/evidence:
 *   get:
 *     summary: Listar evidências de um caso
 *     tags: [Evidence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *         description: 'ID do caso'
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [image, text]
 *         description: 'Filtrar por tipo de evidência'
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
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Evidence'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

import express from "express"
import {
  getAllEvidence,
  getEvidence,
  createEvidence,
  updateEvidence,
  deleteEvidence,
} from "../controllers/evidence.controller.js"
import { getEvidenceReportsByEvidence } from "../controllers/evidenceReport.controller.js"
import { Evidence } from "../models/evidence.model.js"
import advancedResults from "../middleware/advancedResults.middleware.js"
import { protect, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

router.use(protect)

router
  .route("/")
  .get(
    advancedResults(Evidence, [
      { path: "collectedBy", select: "name email" },
      { path: "case", select: "title status" },
    ]),
    getAllEvidence,
  )
  .post(authorize("admin", "perito", "assistente"), createEvidence)

router
  .route("/:id")
  .get(getEvidence)
  .put(authorize("admin", "perito", "assistente"), updateEvidence)
  .delete(authorize("admin", "perito"), deleteEvidence)

// Nova rota para obter relatórios de uma evidência específica
router.route("/:evidenceId/reports").get(getEvidenceReportsByEvidence)

export default router
