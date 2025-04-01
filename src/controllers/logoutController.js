const User = require("../models/User");

exports.logout = async (req, res) => {
  try {
    const token = req.header("x-auth-token");
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Token não fornecido" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { invalidatedTokens: token } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Usuário não encontrado" });
    }

    res.json({ 
      success: true,
      message: "Logout realizado com sucesso",
      invalidatedAt: new Date() 
    });
  } catch (err) {
    console.error("Erro no logout:", err);
    res.status(500).json({ 
      success: false, 
      message: "Erro no servidor",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};
