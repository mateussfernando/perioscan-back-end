import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";
import fs from "fs";
import path from "path";

/**
 * @desc    Upload de imagem para o Cloudinary
 * @route   POST /api/upload
 * @access  Privado
 */
export const uploadImage = asyncHandler(async (req, res, next) => {
  // Verificar se um arquivo foi enviado
  if (!req.file) {
    const error = new Error("Por favor, envie um arquivo");
    error.statusCode = 400;
    return next(error);
  }
  
  try {
    // Caminho do arquivo temporário
    const filePath = req.file.path;
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      const error = new Error(`Arquivo temporário não encontrado: ${filePath}`);
      error.statusCode = 404;
      return next(error);
    }
    
    // Obter informações do arquivo
    const fileStats = fs.statSync(filePath);
    if (fileStats.size === 0) {
      const error = new Error("O arquivo enviado está vazio");
      error.statusCode = 400;
      return next(error);
    }
    
    // Pasta no Cloudinary baseada no tipo de evidência (se fornecido)
    const folder = req.body.evidenceType 
      ? `forensic-dental/${req.body.evidenceType}` 
      : "forensic-dental";
    
    // Opções adicionais para o upload
    const options = {
      tags: [req.body.evidenceType || 'evidence', 'upload'],
      context: {
        user_id: req.user.id,
        uploaded_at: new Date().toISOString(),
        evidence_type: req.body.evidenceType || 'generic'
      }
    };
    
    // Fazer upload para o Cloudinary
    const result = await uploadImage(filePath, folder, options);
    
    // Adicionar informações extras ao resultado
    result.original_name = req.file.originalname;
    result.mimetype = req.file.mimetype;
    result.size = req.file.size;
    
    // Remover arquivo temporário após o upload
    fs.unlink(filePath, (err) => {
      if (err) console.error("Erro ao remover arquivo temporário:", err);
    });
    
    // Retornar resultado
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Tentar remover o arquivo temporário em caso de erro
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Erro ao remover arquivo temporário após falha:", unlinkError);
      }
    }
    
    return next(error);
  }
});

/**
 * @desc    Excluir imagem do Cloudinary
 * @route   DELETE /api/upload/:publicId
 * @access  Privado
 */
export const deleteCloudinaryImage = asyncHandler(async (req, res, next) => {
  const { publicId } = req.params;
  
  if (!publicId) {
    const error = new Error("ID público da imagem não fornecido");
    error.statusCode = 400;
    return next(error);
  }
  
  try {
    const result = await deleteImage(publicId);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
});