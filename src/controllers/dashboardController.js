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
 * Versão robusta que valida a resposta da API Python.
 */
export const featureImportance = async (req, res) => {
  try {
    const pythonApiUrl =
      process.env.PYTHON_API_URL ||
      "https://python-graficos-perioscan.onrender.com/api/modelo/coeficientes";

    const response = await fetch(pythonApiUrl);

    // Validação da resposta
    if (response.status === 404) {
      throw new Error(
        `A rota '${pythonApiUrl}' não foi encontrada no servidor Python. Verifique o deploy e a URL.`
      );
    }
    if (!response.ok) {
      throw new Error(
        `O serviço de ML Python respondeu com o status: ${response.status}`
      );
    }

    // Verifica se a resposta é realmente JSON antes de a processar
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      res.status(200).json(data);
    } else {
      // Se não for JSON, é provável que seja a página de boas-vindas
      throw new Error(
        "O servidor Python retornou uma resposta inesperada (não-JSON). Verifique se a rota da API está correta."
      );
    }
  } catch (error) {
    console.error(
      "Erro ao comunicar com o serviço de ML Python:",
      error.message
    );
    res.status(502).json({
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
