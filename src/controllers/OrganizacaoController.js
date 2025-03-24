const mongoose = require('mongoose');
const Organizacao = require('../models/Organizacao');
const User = require('../models/User');
const crypto = require('crypto');

const OrganizacaoController = {
  // Adicionar usuário à organização
  async adicionarUsuario(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { organizacaoId } = req.params;
      const { name, email, password, role } = req.body;

      // Verifica organização
      const organizacao = await Organizacao.findById(organizacaoId).session(session);
      if (!organizacao) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Organização não encontrada' });
      }

      // Verifica se o usuário logado é admin
      if (organizacao.admin.toString() !== req.user.id) {
        await session.abortTransaction();
        return res.status(403).json({ message: 'Acesso negado' });
      }

      // Validação de cargo
      if (!['perito', 'assistente'].includes(role)) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Cargo inválido' });
      }

      // Verifica e-mail duplicado
      const existingUser = await User.findOne({ email }).session(session);
      if (existingUser) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'E-mail já cadastrado' });
      }

      // Cria usuário
      const user = new User({ name, email, password, role, organizacao: organizacaoId });
      await user.save({ session });

      // Atualiza organização
      organizacao.users.push(user._id);
      await organizacao.save({ session });

      await session.commitTransaction();

      // Resposta sem a senha
      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      res.status(201).json({ message: 'Usuário adicionado', user: userResponse });

    } catch (error) {
      await session.abortTransaction();
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ message: 'Erro de validação', errors });
      }

      console.error('Erro ao adicionar usuário:', error);
      res.status(500).json({ 
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message 
      });
    } finally {
      session.endSession();
    }
  },

  // Obter detalhes da organização
  async obterOrganizacao(req, res) {
    try {
      const organizacao = await Organizacao.findById(req.params.organizacaoId)
        .populate('admin', 'name email')
        .populate('users', 'name email role');

      if (!organizacao) {
        return res.status(404).json({ message: 'Organização não encontrada' });
      }

      res.json(organizacao);
    } catch (error) {
      console.error('Erro ao buscar organização:', error);
      res.status(500).json({ 
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message 
      });
    }
  },

  // Gerar código de convite
  async gerarConvite(req, res) {
    try {
      const organizacao = await Organizacao.findById(req.params.organizacaoId);
      
      organizacao.conviteCode = crypto.randomBytes(8).toString('hex');
      organizacao.conviteExpiracao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
      
      await organizacao.save();

      res.json({ 
        codigo: organizacao.conviteCode,
        expiracao: organizacao.conviteExpiracao 
      });
    } catch (error) {
      console.error('Erro ao gerar convite:', error);
      res.status(500).json({ 
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message 
      });
    }
  }
};

module.exports = OrganizacaoController;