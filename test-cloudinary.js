// test-cloudinary.js
import { uploadImage } from './src/utils/cloudinary.js';  
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Obter o diretório atual (necessário quando se usa ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCloudinaryUpload() {
  try {
    // Substitua pelo caminho de uma imagem de teste
    const testImagePath = path.join(__dirname, '/uploads/img_teste.jpeg');
    
    console.log('Iniciando upload de teste para o Cloudinary...');
    console.log('Caminho da imagem:', testImagePath);
    
    const result = await uploadImage(testImagePath, 'test-folder');
    
    console.log('Upload bem-sucedido!');
    console.log('Resultado:', result);
    
    return result;
  } catch (error) {
    console.error('Erro no teste de upload:', error);
    throw error;
  }
}

testCloudinaryUpload()
  .then(result => console.log('Teste concluído com sucesso'))
  .catch(error => console.error('Teste falhou:', error));