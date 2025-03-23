const mongoose = require('mongoose');

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
    required: [true, 'O admin da organização é obrigatório'] 
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  }],
  conviteCode: {
    type: String,
    unique: true,
    // Você pode gerar este código automaticamente antes de salvar o documento
  },
  metadata: {
    endereco: String,
    telefone: String,
    email: String
  }
}, {
  timestamps: true
});

// Método para verificar se um usuário pertence à organização
organizacaoSchema.methods.hasUser = function(userId) {
  return this.users.includes(userId) || this.admin.equals(userId);
};

// Método para adicionar um usuário à organização
organizacaoSchema.methods.addUser = function(userId) {
  if (!this.users.includes(userId)) {
    this.users.push(userId);
  }
  return this;
};

module.exports = mongoose.model('Organizacao', organizacaoSchema);