const mongoose = require('mongoose');
const crypto = require('crypto');

const organizacaoSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'O nome da organização é obrigatório'],
    trim: true, 
    minlength: [3, 'O nome deve ter pelo menos 3 caracteres']
  },
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'O admin é obrigatório'] 
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  }],
  conviteCode: {
    type: String,
    unique: true,
    default: function() {
      return crypto.randomBytes(8).toString('hex');
    }
  },
  conviteExpiracao: {
    type: Date,
    default: () => Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dias
  }
}, { timestamps: true });

// Métodos (mantidos)
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