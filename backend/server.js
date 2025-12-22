const express = require('express');
const cors = require('cors');
const body = require('body-parser');
const route = require('./src/route.js');

const app = express();
const port = 3000

app.use(cors());
app.use(body.json());

app.use('/', route);

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});