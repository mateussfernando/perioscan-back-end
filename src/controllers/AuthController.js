const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Organizacao = require('../models/Organizacao');

const AuthController = {
  async cadastroUsuario(req, res) {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'E-mail já cadastrado' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({ name, email, password: hashedPassword });
      await user.save();

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(201).json({
        message: 'Usuário registrado. Complete seu perfil!',
        token
      });

    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ message: 'E-mail já cadastrado' });
      }
      res.status(500).json({ message: 'Erro no servidor', error: err.message });
    }
  },

  async registroMembro(req, res) {
    try {
      const { name, email, password, role, codigoConvite } = req.body;

      if (!['perito', 'assistente'].includes(role)) {
        return res.status(400).json({ message: 'Cargo inválido' });
      }

      const organizacao = await Organizacao.findOne({ conviteCode: codigoConvite });
      if (!organizacao) {
        return res.status(404).json({ message: 'Convite inválido ou expirado' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({ name, email, password: hashedPassword, role, organizacao: organizacao._id });
      await user.save();

      organizacao.users.push(user._id);
      await organizacao.save();

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

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).populate('organizacao', 'name');

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      const tokenPayload = { 
        id: user._id, 
        role: user.role 
      };
      
      if (user.organizacao) {
        tokenPayload.organizationId = user.organizacao._id;
      }

      const token = jwt.sign(
        tokenPayload,
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
          organizacao: user.organizacao ? { 
            id: user.organizacao._id, 
            name: user.organizacao.name 
          } : null
        }
      });

    } catch (error) {
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  },

  async getPerfil(req, res) {
    try {
      const user = await User.findById(req.user.id).populate('organizacao', 'name');
      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizacao: user.organizacao ? { 
            id: user.organizacao._id, 
            name: user.organizacao.name 
          } : null
        }
      });
    } catch (error) {
      res.status(500).json({
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
      });
    }
  },

  async updatePerfil(req, res) {
    try {
      const { name, email, currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id);

      if (name) user.name = name;

      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
        if (existingUser) return res.status(400).json({ message: 'E-mail já em uso' });
        user.email = email;
      }

      if (currentPassword && newPassword) {
        if (!(await bcrypt.compare(currentPassword, user.password))) {
          return res.status(400).json({ message: 'Senha atual incorreta' });
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
      }

      await user.save();
      res.json({ 
        message: 'Perfil atualizado',
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
  }
};

module.exports = AuthController;