const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organizacao = require('../models/Organizacao');

const AuthController = {
  // Registro de Administrador
  async registroAdmin(req, res) {
    try {
      const { name, email, password, organizacaoNome } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'E-mail já cadastrado' });

      const organizacao = new Organizacao({ name: organizacaoNome, admin: null, users: [] });
      const savedOrganizacao = await organizacao.save();

      const user = new User({ name, email, password, role: 'admin', organizacao: savedOrganizacao._id });
      const savedUser = await user.save();

      savedOrganizacao.admin = savedUser._id;
      await savedOrganizacao.save();

      const token = jwt.sign(
        { id: savedUser._id, role: savedUser.role, organizationId: savedOrganizacao._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Administrador e organização criados com sucesso',
        token,
        user: {
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          organizacao: { id: savedOrganizacao._id, name: savedOrganizacao.name }
        }
      });
    } catch (err) {
      console.error('Erro ao registrar administrador:', err);
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message
      });
    }
  },

  // Registro de Membro
  async registroMembro(req, res) {
    try {
      const { name, email, password, role, codigoOrganizacao } = req.body;

      if (!['perito', 'assistente'].includes(role)) {
        return res.status(400).json({ message: 'Cargo inválido' });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'E-mail já cadastrado' });

      const organizacao = await Organizacao.findById(codigoOrganizacao);
      if (!organizacao) return res.status(404).json({ message: 'Organização não encontrada' });

      const user = new User({ name, email, password, role, organizacao: organizacao._id });
      const savedUser = await user.save();

      organizacao.users.push(savedUser._id);
      await organizacao.save();

      const token = jwt.sign(
        { id: savedUser._id, role: savedUser.role, organizationId: organizacao._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Usuário registrado com sucesso',
        token,
        user: {
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          organizacao: { id: organizacao._id, name: organizacao.name }
        }
      });
    } catch (err) {
      console.error('Erro ao registrar membro:', err);
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message
      });
    }
  },

  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).populate('organizacao', 'name');
      
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role, organizationId: user.organizacao._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizacao: { id: user.organizacao._id, name: user.organizacao.name }
        }
      });
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message
      });
    }
  },

  // Obter Perfil
  async getPerfil(req, res) {
    try {
      const user = await User.findById(req.user.id).populate('organizacao', 'name');
      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizacao: { id: user.organizacao._id, name: user.organizacao.name }
        }
      });
    } catch (err) {
      console.error('Erro ao obter perfil:', err);
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message
      });
    }
  },

  // Atualizar Perfil
  async updatePerfil(req, res) {
    try {
      const { name, email, currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      if (name) user.name = name;
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
        if (existingUser) return res.status(400).json({ message: 'E-mail já está em uso' });
        user.email = email;
      }

      if (currentPassword && newPassword) {
        if (!(await bcrypt.compare(currentPassword, user.password))) {
          return res.status(400).json({ message: 'Senha atual incorreta' });
        }
        user.password = newPassword;
      }

      await user.save();
      res.json({ message: 'Perfil atualizado com sucesso', user });
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message
      });
    }
  },

  // Listar Usuários da Organização
  async listarUsuarios(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const organizacao = await Organizacao.findOne({ admin: req.user.id })
        .populate('users', 'name email role');
      
      const users = await User.find({ organizacao: organizacao._id })
        .select('name email role createdAt');
      
      res.json({ users });
    } catch (err) {
      console.error('Erro ao listar usuários:', err);
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message
      });
    }
  }
};

module.exports = AuthController;