const mongoose = require('mongoose'); 
const bcrypt = require('bcryptjs'); 

const userSchema = new mongoose.Schema({ 

  name: {  
    type: String,  
    required: [true, 'O nome do usuário é obrigatório'],  
    trim: true,  
    minlength: [3, 'O nome deve ter pelo menos 3 caracteres']  
  }, 

  email: {  
    type: String,  
    required: [true, 'O e-mail do usuário é obrigatório'],  
    unique: true,  
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'E-mail inválido'],
    lowercase: true  

  }, 

  password: {  
    type: String,  
    required: [true, 'A senha do usuário é obrigatória'],  
    minlength: [6, 'A senha deve ter pelo menos 6 caracteres']  

  }, 
  role: {
    type: String,
    enum: ['administrador', 'perito', 'assistente'],
    required: true
  },

  organizacao: {  
    type: mongoose.Schema.Types.ObjectId,  
    ref: 'Organizacao', // Referência ao modelo de Organizacao 
    required: [true, 'A organização do usuário é obrigatória']  
  }, 

}, {  
  timestamps: true // Adiciona createdAt e updatedAt automaticamente 
}); 

// Hash da senha antes de salvar 

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  });

module.exports = mongoose.model('User', userSchema); 