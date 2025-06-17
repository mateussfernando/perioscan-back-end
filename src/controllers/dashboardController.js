// controllers/dashboardController.js

import Case from "../models/case.model.js";
import Victim from "../models/victim.model.js";

// --- Funções de Lógica para as Rotas ---

const buildDateFilter = (startDate, endDate) => {
  const dateFilter = {};
  if (startDate) {
    dateFilter["$gte"] = new Date(startDate);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    dateFilter["$lte"] = end;
  }
  return dateFilter;
};

export const caseDistribution = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "status" } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    const pipeline = [];

    if (Object.keys(dateFilter).length > 0) {
      pipeline.push({ $match: { openDate: dateFilter } });
    }

    pipeline.push(
      { $group: { _id: `$${groupBy}`, count: { $sum: 1 } } },
      { $project: { _id: 0, name: "$_id", value: "$count" } }
    );

    const results = await Case.aggregate(pipeline);
    res.status(200).json(results);
  } catch (error) {
    console.error("Erro na rota /stats/case-distribution:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const victimProfile = async (req, res) => {
  try {
    const pipeline = [
      { $group: { _id: "$gender", count: { $sum: 1 } } },
      { $project: { _id: 0, name: "$_id", value: "$count" } },
      { $sort: { value: -1 } },
    ];
    const results = await Victim.aggregate(pipeline);
    res.status(200).json(results);
  } catch (error) {
    console.error("Erro na rota /stats/victim-profile:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const temporalEvolution = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    const pipeline = [];

    if (Object.keys(dateFilter).length > 0) {
      pipeline.push({ $match: { openDate: dateFilter } });
    }

    pipeline.push(
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$openDate" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", value: "$count" } }
    );

    const results = await Case.aggregate(pipeline);
    res.status(200).json(results);
  } catch (error) {
    console.error("Erro na rota /stats/temporal-evolution:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

export const ageDistribution = async (req, res) => {
  try {
    const pipeline = [
      { $match: { age: { $exists: true, $type: "number" } } },
      {
        $group: {
          _id: "$identificationType",
          ages: { $push: "$age" },
        },
      },
      {
        $project: {
          _id: 0,
          group: "$_id",
          min: { $min: "$ages" },
          max: { $max: "$ages" },
          avg: { $avg: "$ages" },
          stdDev: { $stdDevPop: "$ages" },
        },
      },
    ];
    const results = await Victim.aggregate(pipeline);
    res.status(200).json(results);
  } catch (error) {
    console.error("Erro na rota /stats/age-distribution:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

/**
 * ROTA 5: Fatores de Influência (ML)
 * Com tratamento de respostas HTML e logs melhorados.
 */
export const featureImportance = async (req, res) => {
  try {
    const pythonApiUrl =
      process.env.PYTHON_API_URL ||
      "https://python-graficos-perioscan.onrender.com/api/modelo/coeficientes";

    console.log("🔁 Chamando API Python:", pythonApiUrl);

    const response = await fetch(pythonApiUrl);

    if (response.status === 404) {
      throw new Error(
        `A rota '${pythonApiUrl}' não foi encontrada no servidor Python.`
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return res.status(200).json(data);
    }

    // Resposta não é JSON → loga o conteúdo para análise
    const body = await response.text();
    console.error(
      "⚠️ Conteúdo inesperado da API Python (não-JSON):",
      body.slice(0, 300)
    );
    return res.status(502).json({
      error:
        "O servidor Python respondeu com conteúdo inválido (provavelmente está acordando). Tente novamente em alguns segundos.",
    });
  } catch (error) {
    console.error(
      "❌ Erro ao comunicar com o serviço de ML Python:",
      error.message
    );
    return res.status(502).json({
      error: `O serviço de Machine Learning está indisponível ou retornou um erro: ${error.message}`,
    });
  }
};

const dashboardController = {
  caseDistribution,
  victimProfile,
  temporalEvolution,
  ageDistribution,
  featureImportance,
};

export default dashboardController;
