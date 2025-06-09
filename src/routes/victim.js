import express from "express";
import Victim from "../models/victim.js";

const router = express.Router();

// Rota para criação de vítima
router.post("/", async (req, res) => {
  try {
    // Se receber birthDate, calcule a idade automaticamente
    let { birthDate, age, ...rest } = req.body;
    if (birthDate) {
      const birth = new Date(birthDate);
      const today = new Date();
      let calcAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calcAge--;
      }
      age = calcAge;
    }
    const victim = new Victim({ ...rest, birthDate, age });
    await victim.save();
    res.status(201).json({ success: true, victim });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
});

export default router;
