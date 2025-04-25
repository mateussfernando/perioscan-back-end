// src/routes/evidenceReport.routes.js

/**
 * @swagger
 * tags:
 *   name: Relatórios de Evidência
 *   description: Gerenciamento de relatórios de análise de evidências
 */

/**
 * @swagger
 * /api/evidence-reports:
 *   get:
 *     summary: Listar todos os relatórios de evidência
 *     description: Retorna uma lista paginada de relatórios de evidência
 *     tags: [Relatórios de Evidência]
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
 *         description: Lista de relatórios de evidência
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
 *                     $ref: '#/components/schemas/EvidenceReport'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Criar um novo relatório de evidência
 *     description: Cria um novo relatório para uma evidência específica
 *     tags: [Relatórios de Evidência]
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
 *               - evidence
 *               - findings
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título do relatório
 *               content:
 *                 type: string
 *                 description: Conteúdo principal do relatório
 *               evidence:
 *                 type: string
 *                 description: ID da evidência analisada
 *               findings:
 *                 type: string
 *                 description: Descobertas da análise
 *               methodology:
 *                 type: string
 *                 description: Metodologia utilizada na análise
 *               conclusion:
 *                 type: string
 *                 description: Conclusão do relatório
 *     responses:
 *       201:
 *         description: Relatório criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EvidenceReport'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para criar relatórios
 *       404:
 *         description: Evidência não encontrada
 */

/**
 * @swagger
 * /api/evidence-reports/{id}:
 *   get:
 *     summary: Obter um relatório de evidência específico
 *     description: Retorna os detalhes de um relatório de evidência pelo ID
 *     tags: [Relatórios de Evidência]
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
 *         description: Detalhes do relatório
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EvidenceReport'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para acessar este relatório
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Atualizar um relatório de evidência
 *     description: Atualiza os detalhes de um relatório existente
 *     tags: [Relatórios de Evidência]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do relatório
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
 *               findings:
 *                 type: string
 *               methodology:
 *                 type: string
 *               conclusion:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [rascunho, finalizado]
 *     responses:
 *       200:
 *         description: Relatório atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EvidenceReport'
 *       400:
 *         description: Dados inválidos ou relatório já assinado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para atualizar este relatório
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Excluir um relatório de evidência
 *     description: Remove um relatório existente (não é possível excluir relatórios assinados)
 *     tags: [Relatórios de Evidência]
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
 *         description: Relatório excluído com sucesso
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
 *         description: Não é possível excluir um relatório assinado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para excluir este relatório
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/evidence-reports/{id}/pdf:
 *   get:
 *     summary: Exportar relatório como PDF
 *     description: Gera e retorna um arquivo PDF do relatório de evidência
 *     tags: [Relatórios de Evidência]
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
 *         description: Arquivo PDF do relatório
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para acessar este relatório
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Erro ao gerar PDF
 */

/**
 * @swagger
 * /api/evidence-reports/{id}/sign:
 *   post:
 *     summary: Assinar digitalmente um relatório de evidência
 *     description: Assina digitalmente um relatório finalizado
 *     tags: [Relatórios de Evidência]
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
 *         description: Relatório assinado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EvidenceReport'
 *       400:
 *         description: Relatório já assinado ou não está no status 'finalizado'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Sem permissão para assinar este relatório
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/evidence-reports/{id}/verify:
 *   get:
 *     summary: Verificar assinatura digital
 *     description: Verifica a autenticidade da assinatura digital de um relatório
 *     tags: [Relatórios de Evidência]
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
 *         description: Relatório não está assinado
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/evidence-reports/verify/{id}:
 *   get:
 *     summary: Verificar autenticidade de um relatório por hash (acesso público)
 *     description: Verifica a autenticidade de um relatório usando hash e código de verificação
 *     tags: [Relatórios de Evidência]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do relatório
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

import express from "express"
import {
  getEvidenceReports,
  getEvidenceReport,
  createEvidenceReport,
  updateEvidenceReport,
  deleteEvidenceReport,
  exportEvidenceReportPDF,
  signEvidenceReport,
  verifyEvidenceReportSignature,
  verifyEvidenceReportByHash,
} from "../controllers/evidenceReport.controller.js"
import EvidenceReport from "../models/evidenceReport.model.js"
import advancedResults from "../middleware/advancedResults.middleware.js"
import { protect, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

// Rota pública para verificação de relatórios
router.route("/verify/:id").get(verifyEvidenceReportByHash)

// Rotas protegidas
router.use(protect)

router
  .route("/")
  .get(
    advancedResults(EvidenceReport, [
      { path: "evidence", select: "type description imageUrl" },
      { path: "case", select: "title status" },
      { path: "expertResponsible", select: "name email" },
    ]),
    getEvidenceReports,
  )
  .post(authorize("admin", "perito"), createEvidenceReport)

router
  .route("/:id")
  .get(getEvidenceReport)
  .put(authorize("admin", "perito"), updateEvidenceReport)
  .delete(authorize("admin", "perito"), deleteEvidenceReport)

router.route("/:id/pdf").get(exportEvidenceReportPDF)
router.route("/:id/sign").post(authorize("admin", "perito"), signEvidenceReport)
router.route("/:id/verify").get(verifyEvidenceReportSignature)

export default router
