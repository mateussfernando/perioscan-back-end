const express = require('express');
const Organizacao = require('../models/Organizacao');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Rota para adicionar um usuário à organização (apenas Admin)
router.post(
  '/organizacoes/:organizacaoId/usuarios', 
  authMiddleware, 
  async (req, res) => {
    const { organizacaoId } = req.params;
    const { name, email, password, role } = req.body;

    try {
      // Verifica se o usuário logado é o Admin da organização
      const organizacao = await Organizacao.findById(organizacaoId);
      if (!organizacao) {
        return res.status(404).json({ message: 'Organização não encontrada' });
      }

      if (organizacao.admin.toString() !== req.user.id) {
        return res.status(403).json({ 
          message: 'Acesso negado: apenas o Administrador pode adicionar usuários' 
        });
      }

      // Verificação adicional que não está no modelo: apenas peritos e assistentes podem ser adicionados
      if (role !== 'perito' && role !== 'assistente') {
        return res.status(400).json({ 
          message: 'Cargo inválido: novos usuários devem ser peritos ou assistentes' 
        });
      }

      // Verifica se o e-mail já está cadastrado
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'E-mail já cadastrado' });
      }

      // Cria o novo usuário - validações do modelo serão aplicadas automaticamente
      const user = new User({
        name,
        email,
        password,
        role,
        organizacao: organizacaoId,
      });

      // Se houver erros de validação, o Mongoose lançará uma exceção
      await user.save();

      // Adiciona o usuário à organização
      organizacao.users.push(user._id);
      await organizacao.save();

      // Não retorna a senha no response
      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      res.status(201).json({ 
        message: 'Usuário adicionado com sucesso', 
        user: userResponse 
      });
    } catch (err) {
      // Tratamento específico para erros de validação do Mongoose
      if (err.name === 'ValidationError') {
        const validationErrors = {};
        
        for (let field in err.errors) {
          validationErrors[field] = err.errors[field].message;
        }
        
        return res.status(400).json({ 
          message: 'Erro de validação', 
          errors: validationErrors 
        });
      }
      
      console.error('Erro ao adicionar usuário:', err);
      res.status(500).json({ 
        message: 'Erro no servidor', 
        error: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message 
      });
    }
  }
);

module.exports = router;