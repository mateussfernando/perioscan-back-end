require("dotenv").config();
const mongoose = require("mongoose");


const dbConfig = {
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};


// Verificação das variáveis essenciais
const requiredVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
];
requiredVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`❌ Erro: Variável ${varName} não definida no arquivo .env`);
    process.exit(1);
  }
});


// Conexão com o MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(dbConfig.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB conectado com sucesso!");
  } catch (err) {
    console.error("❌ Falha na conexão com MongoDB:", err.message);
    process.exit(1);
  }
};


module.exports = { connectDB, dbConfig };


