// src/routes/report.routes.js (adicionar)

/**
 * @swagger
 * /api/reports/{id}/pdf-data:
 *   get:
 *     summary: Obter dados para geração de PDF do relatório
 *     description: Retorna todos os dados necessários para gerar um PDF do relatório no frontend
 *     tags: [Laudos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do relatório
 *     responses:
 *       200:
 *         description: Dados para geração do PDF
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
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/Report'
 *                     forensicCase:
 *                       $ref: '#/components/schemas/Case'
 *                     expert:
 *                       $ref: '#/components/schemas/User'
 *                     evidences:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Evidence'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para acessar este relatório
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

import express from "express"
import {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  exportReportPDF,
  signReport,
  verifyReportSignature,
  verifyReportByHash,
} from "../controllers/report.controller.js"
import Report from "../models/report.model.js"
import advancedResults from "../middleware/advancedResults.middleware.js"
import { protect, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Laudos
 *   description: Gerenciamento de laudos periciais
 */

/**
 * @swagger
 * /api/reports/verify/{id}:
 *   get:
 *     summary: Verificar autenticidade de um laudo por hash (acesso público)
 *     description: Verifica a autenticidade de um laudo usando hash e código de verificação
 *     tags: [Laudos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do laudo
 *       - in: query
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash do conteúdo do documento
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de verificação
 *     responses:
 *       200:
 *         description: Resultado da verificação
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
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                     document:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         signedBy:
 *                           type: string
 *                         signatureDate:
 *                           type: string
 *                           format: date-time
 *                         age:
 *                           type: string
 *                           example: "2 days ago"
 *       400:
 *         description: Parâmetros inválidos
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route("/verify/:id").get(verifyReportByHash)

// Rotas protegidas
router.use(protect)

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Obter todos os laudos
 *     description: Retorna uma lista paginada de laudos
 *     tags: [Laudos]
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
 *           enum: [rascunho, finalizado, assinado]
 *         description: Filtrar por status
 *     responses:
 *       200:
 *         description: Lista de laudos
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
 *                     $ref: '#/components/schemas/Report'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Criar um novo laudo
 *     description: Cria um novo laudo pericial. Requer permissão de admin ou perito.
 *     tags: [Laudos]
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
 *               - content
 *               - case
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título do laudo
 *               content:
 *                 type: string
 *                 description: Conteúdo principal do laudo
 *               case:
 *                 type: string
 *                 description: ID do caso ao qual o laudo pertence
 *               status:
 *                 type: string
 *                 enum: [rascunho, finalizado]
 *                 default: rascunho
 *                 description: Status inicial do laudo
 *               methodology:
 *                 type: string
 *                 description: Metodologia utilizada na análise
 *               conclusion:
 *                 type: string
 *                 description: Conclusão do laudo
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs das evidências anexadas ao laudo
 *     responses:
 *       201:
 *         description: Laudo criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para criar laudos
 *       404:
 *         description: Caso não encontrado
 */
router
  .route("/")
  .get(
    advancedResults(Report, [
      { path: "expertResponsible", select: "name email" },
      { path: "case", select: "title status" },
    ]),
    getReports,
  )
  .post(authorize("admin", "perito"), createReport)

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Obter um laudo específico
 *     description: Retorna os detalhes de um laudo específico pelo ID
 *     tags: [Laudos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do laudo
 *     responses:
 *       200:
 *         description: Detalhes do laudo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para acessar este laudo
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Atualizar um laudo
 *     description: Atualiza os detalhes de um laudo existente
 *     tags: [Laudos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do laudo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [rascunho, finalizado, assinado]
 *               methodology:
 *                 type: string
 *               conclusion:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Laudo atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       400:
 *         description: Dados inválidos ou laudo já assinado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para atualizar este laudo
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Excluir um laudo
 *     description: Remove um laudo existente (não é possível excluir laudos assinados)
 *     tags: [Laudos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do laudo
 *     responses:
 *       200:
 *         description: Laudo excluído com sucesso
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
 *       400:
 *         description: Não é possível excluir um laudo assinado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para excluir este laudo
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router
  .route("/:id")
  .get(getReport)
  .put(authorize("admin", "perito"), updateReport)
  .delete(authorize("admin", "perito"), deleteReport)

/**
 * @swagger
 * /api/reports/{id}/pdf:
 *   get:
 *     summary: Exportar laudo como PDF
 *     description: Gera e retorna um arquivo PDF do laudo
 *     tags: [Laudos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do laudo
 *     responses:
 *       200:
 *         description: Arquivo PDF do laudo
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para acessar este laudo
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Erro ao gerar PDF
 */
router.route("/:id/pdf").get(exportReportPDF)

/**
 * @swagger
 * /api/reports/{id}/sign:
 *   post:
 *     summary: Assinar digitalmente um laudo
 *     description: Assina digitalmente um laudo finalizado
 *     tags: [Laudos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do laudo
 *     responses:
 *       200:
 *         description: Laudo assinado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       400:
 *         description: Laudo já assinado ou não está no status 'finalizado'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para assinar este laudo
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route("/:id/sign").post(authorize("admin", "perito"), signReport)

/**
 * @swagger
 * /api/reports/{id}/verify:
 *   get:
 *     summary: Verificar assinatura digital
 *     description: Verifica a autenticidade da assinatura digital de um laudo
 *     tags: [Laudos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do laudo
 *     responses:
 *       200:
 *         description: Resultado da verificação
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
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                     signedBy:
 *                       type: object
 *                     signatureDate:
 *                       type: string
 *                       format: date-time
 *                     age:
 *                       type: string
 *                       example: "2 days ago"
 *       400:
 *         description: Laudo não está assinado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route("/:id/verify").get(verifyReportSignature)

export default router

