const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Organizacao = require('../models/Organizacao');

const AuthController = {
  // Registro de Administrador + Organização
  async registroAdmin(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { name, email, password, organizacaoNome } = req.body;

      // Validações básicas
      if (!name || !email || !password || !organizacaoNome) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
      }

      // Verifica e-mail duplicado
      const existingUser = await User.findOne({ email }).session(session);
      if (existingUser) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'E-mail já cadastrado' });
      }

      // Cria organização
      const organizacao = new Organizacao({
        name: organizacaoNome,
        admin: null,
        users: []
      });
      const savedOrganizacao = await organizacao.save({ session });

      // Cria admin
      const user = new User({
        name,
        email,
        password,
        role: 'administrador',
        organizacao: savedOrganizacao._id
      });
      const savedUser = await user.save({ session });

      // Atualiza organização com admin
      savedOrganizacao.admin = savedUser._id;
      await savedOrganizacao.save({ session });

      // Commit da transação
      await session.commitTransaction();

      // Gera token
      const token = jwt.sign(
        { id: savedUser._id, role: savedUser.role, organizationId: savedOrganizacao._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Administrador criado com sucesso',
        token,
        user: {
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          organizacao: { id: savedOrganizacao._id, name: savedOrganizacao.name }
        }
      });

    } catch (error) {
      await session.abortTransaction();
      if (error.code === 11000) {
        return res.status(400).json({ message: 'E-mail já cadastrado' });
      }
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    } finally {
      session.endSession();
    }
  },

  // Registro de Perito/Assistente via Convite
  async registroMembro(req, res) {
    try {
      const { name, email, password, role, codigoConvite } = req.body;

      // Validação de cargo
      if (!['perito', 'assistente'].includes(role)) {
        return res.status(400).json({ message: 'Cargo inválido' });
      }

      // Busca organização pelo código de convite
      const organizacao = await Organizacao.findOne({ conviteCode: codigoConvite });
      if (!organizacao) {
        return res.status(404).json({ message: 'Convite inválido ou expirado' });
      }

      // Cria usuário
      const user = new User({ name, email, password, role, organizacao: organizacao._id });
      await user.save();

      // Atualiza organização
      organizacao.users.push(user._id);
      await organizacao.save();

      // Gera token
      const token = jwt.sign(
        { id: user._id, role: user.role, organizationId: organizacao._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Usuário registrado com sucesso',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizacao: { id: organizacao._id, name: organizacao.name }
        }
      });

    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'E-mail já cadastrado' });
      }
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
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

      // Gera token
      const token = jwt.sign(
        { id: user._id, role: user.role, organizationId: user.organizacao._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login bem-sucedido',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizacao: { id: user.organizacao._id, name: user.organizacao.name }
        }
      });

    } catch (error) {
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  },

  // Obter perfil do usuário
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
    } catch (error) {
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  },

  // Atualizar perfil
  async updatePerfil(req, res) {
    try {
      const { name, email, currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      // Atualiza nome
      if (name) user.name = name;

      // Atualiza e-mail
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
        if (existingUser) return res.status(400).json({ message: 'E-mail já em uso' });
        user.email = email;
      }

      // Atualiza senha
      if (currentPassword && newPassword) {
        if (!(await bcrypt.compare(currentPassword, user.password))) {
          return res.status(400).json({ message: 'Senha atual incorreta' });
        }
        user.password = newPassword;
      }

      await user.save();
      res.json({ message: 'Perfil atualizado', user });

    } catch (error) {
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  }
};

module.exports = AuthController;