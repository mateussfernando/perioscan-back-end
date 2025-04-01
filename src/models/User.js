const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "O nome é obrigatório"],
    maxlength: [50, "O nome não pode ter mais que 50 caracteres"],
  },
  email: {
    type: String,
    required: [true, "O email é obrigatório"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Por favor, insira um email válido",
    ],
  },
  password: {
    type: String,
    required: [true, "A senha é obrigatória"],
    minlength: [8, "A senha deve ter no mínimo 8 caracteres"],
    select: false,
  },
  role: {
    type: String,
    enum: ["admin", "perito", "assistente"],
    default: "assistente",
  },
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
  },
  invalidatedTokens: {
    type: [String],
    select: false,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});


// Hash da senha antes de salvar
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  this.password = await bcrypt.hash(this.password, 10);
});


module.exports = mongoose.model("User", UserSchema);


