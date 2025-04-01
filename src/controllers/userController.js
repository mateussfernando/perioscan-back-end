const User = require("../models/User");

exports.deleteUser = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const { id } = req.params;

    // Verifica se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    if (req.user.id === id) {
      return res.status(403).json({
        success: false,
        message: "Auto-exclusão não permitida",
      });
    }

    await User.findByIdAndDelete(id);
    res.json({ success: true, message: "Usuário excluído" });
  } catch (err) {
    console.error("Erro ao excluir:", err);
    res.status(500).json({
      success: false,
      message: "Erro interno",
    });
  }
};
exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user.id; // Obtido do token JWT

  try {
    // Verifica se o novo email já existe (exceto para o próprio usuário)
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email já está em uso por outro usuário",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true, runValidators: true } // Retorna o usuário atualizado e valida os campos
    ).select("-password");

    res.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar perfil",
    });
  }
};