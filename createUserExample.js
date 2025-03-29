// createUserExample.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    // Insere um usuário de exemplo
    const user = new User({
      name: "Exemplo",
      email: "exemplo@teste.com",
      password: "123456", // Será hasheado pelo middleware do modelo
      role: "assistente",
    });
    await user.save();
    console.log("✅ Usuário criado e coleção 'users' gerada!");
    mongoose.disconnect();
  })
  .catch((err) => console.error("Erro:", err));
