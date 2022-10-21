const express = require("express");
const apiDana = require("./apiDana.router")
const sendEsp32 = require("./sendEsp32.router")

function routerAPI(app){
  const router = express.Router();
  app.use('', router);
  router.use('/apiDana', apiDana);
  router.use('/sendEsp32', sendEsp32)
}

module.exports = routerAPI;