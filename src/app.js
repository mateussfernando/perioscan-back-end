const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config()

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req,res) => {
    res.end("API esta funcionando!")
})

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});