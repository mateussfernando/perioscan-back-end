const mongoose = require('mongoose');
const crypto = require('crypto');

const organizacaoSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'O nome da organização é obrigatório'] 
  },
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  conviteCode: {
    type: String,
    unique: true
  },
  conviteExpiracao: {
    type: Date
  }
}, { timestamps: true });

// Métodos 
organizacaoSchema.methods.hasUser = function(userId) {
  return this.users.includes(userId) || this.admin.equals(userId);
};

organizacaoSchema.methods.addUser = function(userId) {
  if (!this.users.includes(userId)) {
    this.users.push(userId);
  }
  return this;
};

module.exports = mongoose.model('Organizacao', organizacaoSchema);