const mongoose = require('mongoose');

const organizacaoSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nome da organização
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin da organização
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Usuários da organização
});

module.exports = mongoose.model('Organizacao', organizacaoSchema);