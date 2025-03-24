const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organizacao = require('../models/Organizacao');

const UserController = {
  // Obter perfil do usuário logado
  async getPerfil(req, res) {
    try {
      const user = await User.findById(req.user.id)
        .populate('organizacao', 'name')
        .select('-password');

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizacao: user.organizacao
        }
      });
    } catch (error) {
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  },

  // Atualizar perfil do usuário
  async updatePerfil(req, res) {
    try {
      const { name, email, currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      // Atualizar nome
      if (name) user.name = name;

      // Atualizar email (com verificação de duplicidade)
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'E-mail já está em uso' });
        }
        user.email = email;
      }

      // Atualizar senha
      if (currentPassword && newPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Senha atual incorreta' });
        }
        user.password = newPassword;
      }

      await user.save();
      res.json({ 
        message: 'Perfil atualizado com sucesso',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  },

  // Listar todos os usuários (apenas para administradores)
  async listarTodosUsuarios(req, res) {
    try {
      if (req.user.role !== 'administrador') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const usuarios = await User.find()
        .select('name email role organizacao createdAt')
        .populate('organizacao', 'name');

      res.json({ usuarios });
    } catch (error) {
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }
};

module.exports = UserController;