import express from "express";
import { uploadImage } from "../controllers/upload.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // 👈 Configuração do multer

// Proteger todas as rotas
router.use(protect);

// Rota para upload de imagem ("image" é o nome do campo no formulário)
router.post("/", upload.single("image"), uploadImage);

export default router;