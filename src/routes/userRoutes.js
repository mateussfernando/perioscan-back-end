const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organizacao = require('../models/Organizacao');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Rota para registro de usuário admin
router.post('/registro/admin', async (req, res) => {
  const { name, email, password, organizacaoNome } = req.body;

  try {
    // Verifica se o email já está cadastrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'E-mail já cadastrado' });
    }

    // Cria uma nova organização temporária para poder criar o usuário admin
    const organizacao = new Organizacao({
      name: organizacaoNome,
      admin: null, // Será atualizado após criar o usuário
      users: []
    });

    // Salva a organização temporária
    const savedOrganizacao = await organizacao.save();

    // Cria o novo usuário admin
    const user = new User({
      name,
      email,
      password, // Será hasheado automaticamente pelo middleware no modelo
      role: 'admin',
      organizacao: savedOrganizacao._id
    });

    // Salva o usuário
    const savedUser = await user.save();

    // Atualiza a organização com o ID do admin
    savedOrganizacao.admin = savedUser._id;
    await savedOrganizacao.save();

    // Gera token JWT
    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Responde com o token e dados básicos do usuário
    res.status(201).json({
      message: 'Administrador e organização criados com sucesso',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        organizacao: {
          id: savedOrganizacao._id,
          name: savedOrganizacao.name
        }
      }
    });
  } catch (err) {
    console.error('Erro ao registrar administrador:', err);
    res.status(500).json({
      message: 'Erro no servidor',
      error: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message
    });
  }
});

// Rota para registro de perito/assistente (associação a organização existente)
router.post('/registro/membro', async (req, res) => {
  const { name, email, password, role, codigoOrganizacao } = req.body;

  try {
    // Valida o papel (role)
    if (role !== 'perito' && role !== 'assistente') {
      return res.status(400).json({ message: 'Cargo inválido. Deve ser perito ou assistente' });
    }

    // Verifica se o email já está cadastrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'E-mail já cadastrado' });
    }

   
   
    const organizacao = await Organizacao.findById(codigoOrganizacao);
    if (!organizacao) {
      return res.status(404).json({ message: 'Organização não encontrada' });
    }

    // Cria o novo usuário
    const user = new User({
      name,
      email,
      password,
      role,
      organizacao: organizacao._id
    });

    // Salva o usuário
    const savedUser = await user.save();

    // Adiciona o usuário à organização
    organizacao.users.push(savedUser._id);
    await organizacao.save();

    // Gera token JWT
    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
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
        organizacao: {
          id: organizacao._id,
          name: organizacao.name
        }
      }
    });
  } catch (err) {
    console.error('Erro ao registrar membro:', err);
    res.status(500).json({
      message: 'Erro no servidor',
      error: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message
    });
  }
});

// Rota para login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Busca o usuário pelo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verifica a senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Busca informações da organização
    const organizacao = await Organizacao.findById(user.organizacao);
    if (!organizacao) {
      return res.status(404).json({ message: 'Organização não encontrada' });
    }

    // Gera token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
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
        organizacao: {
          id: organizacao._id,
          name: organizacao.name
        }
      }
    });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    res.status(500).json({
      message: 'Erro no servidor',
      error: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message
    });
  }
});

// Rota para obter perfil do usuário (protegida)
router.get('/perfil', authMiddleware, async (req, res) => {
  try {
    // O middleware já adicionou o usuário à requisição
    const user = req.user;

    // Busca informações da organização
    const organizacao = await Organizacao.findById(user.organizacao);
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizacao: organizacao ? {
          id: organizacao._id,
          name: organizacao.name
        } : null
      }
    });
  } catch (err) {
    console.error('Erro ao obter perfil:', err);
    res.status(500).json({
      message: 'Erro no servidor',
      error: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message
    });
  }
});

// Rota para atualizar perfil do usuário (protegida)
router.put('/perfil', authMiddleware, async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    // Busca o usuário completo (com senha)
    const user = await User.findById(userId);
    
    // Atualiza os campos básicos se fornecidos
    if (name) user.name = name;
    if (email && email !== user.email) {
      // Verifica se o novo email já está em uso
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'E-mail já está em uso' });
      }
      user.email = email;
    }
    
    // Atualiza a senha se fornecida
    if (currentPassword && newPassword) {
      // Verifica se a senha atual está correta
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Senha atual incorreta' });
      }
      
      // Define a nova senha (será hasheada pelo middleware pre-save)
      user.password = newPassword;
    }
    
    // Salva as alterações
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
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({
      message: 'Erro no servidor',
      error: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message
    });
  }
});

// Rota para listar usuários da organização (apenas Admin)
router.get('/organizacao/usuarios', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    // Verifica se o usuário é admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado: apenas administradores podem listar usuários' });
    }
    
    // Busca a organização do admin
    const organizacao = await Organizacao.findOne({ admin: user._id })
      .populate('users', 'name email role'); // Popula dados dos usuários
    
    if (!organizacao) {
      return res.status(404).json({ message: 'Organização não encontrada' });
    }
    
    // Busca todos os usuários da organização, incluindo o admin
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
});

module.exports = router;