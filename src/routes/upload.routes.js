

import express from "express";
import { uploadImage, deleteCloudinaryImage } from "../controllers/upload.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { handleUploadErrors } from "../middleware/upload.middleware.js";

const router = express.Router();

// Proteger todas as rotas
router.use(protect);

// Rota para upload de imagem
router.post("/", handleUploadErrors, uploadImage);

// Rota para excluir imagem do Cloudinary
router.delete("/:publicId", authorize("admin", "perito"), deleteCloudinaryImage);

export default router;