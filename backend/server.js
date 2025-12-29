const express = require('express');
const cors = require('cors');
const body = require('body-parser');
const path = require('path');
const route = require('./src/route.js');

const app = express();
const port = 3000

app.use(cors());
app.use(body.json());

// Rotas da API primeiro
app.use('/api', route);

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});