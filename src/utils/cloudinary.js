import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

// Carrega variáveis de ambiente
dotenv.config();

// Verificar se as variáveis de ambiente do Cloudinary estão definidas
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Erro: Variáveis de ambiente do Cloudinary ausentes: ${missingEnvVars.join(', ')}`);
  // Não lançar erro aqui para permitir que a aplicação inicie, mas logar o aviso
}

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Faz upload de uma imagem para o Cloudinary
 * @param {String} filePath - Caminho do arquivo temporário ou buffer da imagem
 * @param {String} folder - Pasta no Cloudinary onde a imagem será armazenada
 * @param {Object} options - Opções adicionais para o upload
 * @returns {Promise<Object>} - Objeto com informações da imagem enviada
 */
export const uploadImage = async (filePath, folder = "forensic-dental", options = {}) => {
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      const error = new Error(`Arquivo não encontrado: ${filePath}`);
      error.statusCode = 404;
      throw error;
    }
    
    // Verificar se as credenciais do Cloudinary estão configuradas
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      const error = new Error('Configuração do Cloudinary incompleta');
      error.statusCode = 500;
      throw error;
    }
    
    // Configurar opções de upload
    const uploadOptions = {
      folder: folder,
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      ...options
    };
    
    // Faz upload da imagem para o Cloudinary
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    return {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      created_at: result.created_at,
      tags: result.tags || [],
      original_filename: result.original_filename,
    };
  } catch (error) {
    console.error("Erro no upload para o Cloudinary:", error);
    
    // Verificar se é um erro de API do Cloudinary
    if (error.http_code) {
      const err = new Error(`Erro do Cloudinary: ${error.message}`);
      err.statusCode = error.http_code;
      throw err;
    }
    
    // Se não tiver statusCode, definir como 500
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    
    throw error;
  }
};

/**
 * Remove uma imagem do Cloudinary
 * @param {String} publicId - ID público da imagem no Cloudinary
 * @returns {Promise<Object>} - Resultado da operação de remoção
 */
export const deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      const error = new Error('ID público da imagem não fornecido');
      error.statusCode = 400;
      throw error;
    }
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result !== 'ok') {
      const error = new Error(`Falha ao excluir imagem: ${result.result}`);
      error.statusCode = 400;
      throw error;
    }
    
    return result;
  } catch (error) {
    console.error("Erro ao excluir imagem do Cloudinary:", error);
    
    // Se não tiver statusCode, definir como 500
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    
    throw error;
  }
};

/**
 * Gera uma URL de transformação do Cloudinary
 * @param {String} publicId - ID público da imagem no Cloudinary
 * @param {Object} options - Opções de transformação
 * @returns {String} - URL da imagem transformada
 */
export const getImageUrl = (publicId, options = {}) => {
  if (!publicId) return null;
  
  const defaultOptions = {
    width: 800,
    crop: 'limit',
    quality: 'auto',
    fetch_format: 'auto',
  };
  
  const transformOptions = { ...defaultOptions, ...options };
  
  return cloudinary.url(publicId, transformOptions);
};

export default cloudinary;