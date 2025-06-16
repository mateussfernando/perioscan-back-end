// routes/dashboardRoutes.js

import express from "express";
import dashboardController from "../controllers/dashboardController.js";
const router = express.Router();

// ROTA 1: Distribuição de Casos (Rosca)
router.get("/stats/case-distribution", dashboardController.caseDistribution);

// ROTA 2: Perfil das Vítimas (Barras)
router.get("/stats/victim-profile", dashboardController.victimProfile);

// ROTA 3: Evolução Temporal dos Casos (Linha/Área)
router.get("/stats/temporal-evolution", dashboardController.temporalEvolution);

// ROTA 4: Distribuição de Idade das Vítimas (Box Plot simulado)
router.get("/stats/age-distribution", dashboardController.ageDistribution);

// ROTA 5: Fatores de Influência (ML)
router.get("/ml/feature-importance", dashboardController.featureImportance);

export default router;

// --- Como usar no seu ficheiro principal (ex: server.js ou app.js) ---
// const dashboardRoutes = require('./routes/dashboardRoutes');
// app.use('/api/dashboard', dashboardRoutes);
