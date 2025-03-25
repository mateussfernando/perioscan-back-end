// controllers/OrganizacaoController.js
const mongoose = require('mongoose');
const Organizacao = require('../models/Organizacao');
const User = require('../models/User');
const crypto = require('crypto');

const OrganizacaoController = {
  // Cria uma nova organização e torna o usuário admin
  async criarOrganizacao(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { name } = req.body;
      const userId = req.user.id;

      // Cria organização
      const organizacao = new Organizacao({
        name,
        admin: userId,
        conviteCode: crypto.randomBytes(8).toString('hex'), // Gera código
        conviteExpiracao: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dias
      });

      const savedOrganizacao = await organizacao.save({ session });

      // Atualiza usuário para admin
      await User.findByIdAndUpdate(
        userId,
        { role: 'administrador', organizacao: savedOrganizacao._id },
        { session }
      );

      await session.commitTransaction();

      // Gera novo token com organização
      const token = jwt.sign(
        { id: userId, role: 'administrador', organizationId: savedOrganizacao._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Organização criada com sucesso!',
        token,
        organizacao: {
          id: savedOrganizacao._id,
          name: savedOrganizacao.name,
          conviteCode: savedOrganizacao.conviteCode
        }
      });

    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    } finally {
      session.endSession();
    }
  },

  // Vincula um usuário existente a uma organização via código
  async entrarOrganizacao(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { codigoConvite, role } = req.body;
      const userId = req.user.id;

      // Valida código e cargo
      const organizacao = await Organizacao.findOne({ conviteCode: codigoConvite }).session(session);
      if (!organizacao || !['perito', 'assistente'].includes(role)) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Código ou cargo inválido' });
      }

      // Atualiza usuário
      await User.findByIdAndUpdate(
        userId,
        { role, organizacao: organizacao._id },
        { session }
      );

      organizacao.users.push(userId);
      await organizacao.save({ session });

      await session.commitTransaction();

      // Gera novo token
      const token = jwt.sign(
        { id: userId, role, organizationId: organizacao._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Você entrou na organização!',
        token,
        organizacao: {
          id: organizacao._id,
          name: organizacao.name
        }
      });

    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    } finally {
      session.endSession();
    }
  }
};

module.exports = OrganizacaoController;