"use strict";

const app = require("./app");
const { PORT } = require("./config");

app.listen(3001, '10.0.4.23', function () {
  console.log("Listening on 10.0.4.23:3001");
});
