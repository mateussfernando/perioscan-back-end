const mongoose = require("mongoose");

const EvidenceReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Por favor, forneça um título para o relatório"],
  },
  findings: {
    type: String,
    required: [true, "Por favor, forneça as descobertas da análise"],
  },
  // ...existing code...
});

module.exports = mongoose.model("EvidenceReport", EvidenceReportSchema);
