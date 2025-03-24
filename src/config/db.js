const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro na conexão com MongoDB:', error.message);
    process.exit(1); // Encerra o processo em caso de falha crítica
  }
};

// Eventos de conexão (opcional, mas útil para debug)
mongoose.connection.on('connected', () => {
  console.log('📊 Conexão estabelecida com o MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Erro na conexão com MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Conexão com MongoDB encerrada');
});

// Encerra a conexão ao finalizar o processo (ex: Ctrl+C)
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 Conexão com MongoDB fechada');
  process.exit(0);
});

module.exports = connectDB;