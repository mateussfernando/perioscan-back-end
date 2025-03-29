const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const app = express();
const port = 3337;

app.get("/", (req, res) => {
    res.end("O servidor esta rodando")
} )

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });



