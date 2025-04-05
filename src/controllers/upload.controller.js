import { uploadImage as cloudinaryUpload } from "../utils/cloudinary.js"
import ErrorResponse from "../utils/errorResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import fs from "fs"

// @desc    Upload de imagem para o Cloudinary
// @route   POST /api/upload
// @access  Privado
export const uploadImage = asyncHandler(async (req, res, next) => {
  // Verificar se um arquivo foi enviado
  if (!req.file) {
    return next(new ErrorResponse("Please upload a file", 400))
  }

  try {
    // Caminho do arquivo temporário
    const filePath = req.file.path

    // Pasta no Cloudinary baseada no tipo de evidência (se fornecido)
    const folder = req.body.evidenceType ? `forensic-dental/${req.body.evidenceType}` : "forensic-dental"

    // Fazer upload para o Cloudinary
    const result = await cloudinaryUpload(filePath, folder)

    // Remover arquivo temporário após o upload
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error removing temp file:", err)
    })

    // Retornar resultado
    res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    return next(new ErrorResponse(`Error uploading file: ${error.message}`, 500))
  }
})

