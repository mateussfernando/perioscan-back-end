const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware de autenticação para proteger rotas
 * Verifica se o token JWT é válido e adiciona as informações do usuário à requisição
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Obtém o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    
    // Verifica se o token foi enviado
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Acesso não autorizado. Token não fornecido.' 
      });
    }
    
    // Extrai o token do cabeçalho (remove "Bearer ")
    const token = authHeader.split(' ')[1];
    
    try {
      // Verifica se o token é válido
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Busca o usuário no banco de dados
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }
      
      // Adiciona as informações do usuário à requisição
      req.user = user;
      
      // Continua para o próximo middleware/controlador
      next();
    } catch (error) {
      // Token inválido ou expirado
      return res.status(401).json({ 
        message: 'Token inválido ou expirado' 
      });
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({ 
      message: 'Erro no servidor', 
      error: process.env.NODE_ENV === 'production' ? 'Erro interno' : error.message 
    });
  }
};

module.exports = authMiddleware;