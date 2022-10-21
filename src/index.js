const express = require("express");
const routerAPI = require("./routes");
const req = require("express/lib/request");
const app  = express();
const port = 3001;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hola mi server en express');
});

routerAPI(app);

app.listen(port, () => {
  console.log("Escuchando en: localhost:3001")
});
