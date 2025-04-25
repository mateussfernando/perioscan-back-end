// src/routes/upload.routes.js

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Gerenciamento de uploads de arquivos
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Fazer upload de uma imagem
 *     description: Envia uma imagem para o Cloudinary e retorna os dados do upload
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo de imagem a ser enviado
 *               evidenceType:
 *                 type: string
 *                 description: Tipo de evidência (opcional)
 *     responses:
 *       200:
 *         description: Upload realizado com sucesso
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
 *                     public_id:
 *                       type: string
 *                     url:
 *                       type: string
 *                     format:
 *                       type: string
 *                     width:
 *                       type: number
 *                     height:
 *                       type: number
 *                     bytes:
 *                       type: number
 *       400:
 *         description: Erro de validação ou arquivo inválido
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Erro no servidor
 */

import express from "express"
import { uploadImage } from "../controllers/upload.controller.js"
import { protect } from "../middleware/auth.middleware.js"
import upload from "../middleware/upload.middleware.js"

const router = express.Router()

// Proteger todas as rotas
router.use(protect)

// Rota para upload de imagem
router.post("/", upload.single("image"), uploadImage)

export default router

