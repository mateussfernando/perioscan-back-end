const User = require("../models/User");

// Cadastrar novo usuário (Admin apenas)
exports.createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "Usuário já existe" });

    user = new User({ name, email, password, role });
    await user.save();

    res.json({ msg: "Usuário cadastrado com sucesso" });
  } catch (err) {
    res.status(500).send("Erro no servidor");
  }
};

// Listar todos os usuários (Admin apenas)
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).send("Erro no servidor");
  }
};
