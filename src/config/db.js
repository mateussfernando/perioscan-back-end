const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("❌ Variável MONGO_URI não definida no .env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB conectado com sucesso!");
  } catch (err) {
    console.error("❌ Falha na conexão com MongoDB:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;