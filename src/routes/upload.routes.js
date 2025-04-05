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

