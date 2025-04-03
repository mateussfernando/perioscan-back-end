import cloudinary from "cloudinary"
import dotenv from "dotenv"

// Carrega variáveis de ambiente
dotenv.config()

// Configuração do Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Faz upload de uma imagem para o Cloudinary
 * @param {String} filePath - Caminho do arquivo temporário ou buffer da imagem
 * @param {String} folder - Pasta no Cloudinary onde a imagem será armazenada
 * @returns {Promise<Object>} - Objeto com informações da imagem enviada
 */
export const uploadImage = async (filePath, folder = "forensic-dental") => {
  try {
    // Faz upload da imagem para o Cloudinary
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: folder,
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
    })

    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }
}

/**
 * Remove uma imagem do Cloudinary
 * @param {String} publicId - ID público da imagem no Cloudinary
 * @returns {Promise<Object>} - Resultado da operação de remoção
 */
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.v2.uploader.destroy(publicId)
    return result
  } catch (error) {
    console.error("Cloudinary delete error:", error)
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}

export default cloudinary.v2

