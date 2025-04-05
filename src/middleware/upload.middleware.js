import multer from "multer";
import path from "path";
import fs from "fs";

// Garantir que o diretório de upload existe
const uploadDir = path.join(process.cwd(), "public", "uploads", "temp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento para o Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome de arquivo único com timestamp e nome original sanitizado
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${sanitizedFilename}`);
  },
});

// Filtro para verificar tipos de arquivo permitidos
const fileFilter = (req, file, cb) => {
  // Tipos de arquivo permitidos
  const filetypes = /jpeg|jpg|png|gif|tiff|bmp|dicom|dcm/;
  
  // Verificar extensão
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  
  // Verificar mimetype
  const mimetype = filetypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    const error = new Error('Tipo de arquivo não suportado. Por favor, envie um arquivo de imagem.');
    error.statusCode = 400;
    cb(error, false);
  }
};

// Configuração do Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_UPLOAD) || 5000000, // 5MB por padrão
  },
  fileFilter: fileFilter,
});

// Middleware para lidar com erros do Multer
export const handleUploadErrors = (req, res, next) => {
  const uploadSingle = upload.single("image");
  
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const error = new Error(`Arquivo muito grande. Tamanho máximo: ${process.env.MAX_FILE_UPLOAD / 1000000}MB`);
        error.statusCode = 400;
        return next(error);
      }
      err.statusCode = 400;
      return next(err);
    } else if (err) {
      return next(err);
    }
    

    next();
  });
};

export default upload;