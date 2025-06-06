const EvidenceReport = require("../models/EvidenceReport");

// Criar novo EvidenceReport
exports.createEvidenceReport = async (req, res) => {
  console.log("REQ.BODY:", req.body);
  try {
    const { title, findings } = req.body;
    const report = new EvidenceReport({ title, findings });
    await report.save();
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, error });
  }
};

// ...outros métodos como listar, atualizar, deletar...
