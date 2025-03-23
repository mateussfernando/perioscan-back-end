const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,      // Usa o novo parser de URL
      useUnifiedTopology: true,  // Usa o novo mecanismo de monitoramento
    });
    console.log('MongoDB conectado!');
  } catch (err) {
    console.error('Erro ao conectar ao MongoDB:', err.message);
    process.exit(1);  // Encerra o processo em caso de erro
  }
};