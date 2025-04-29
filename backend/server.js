const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

require("dotenv").config();

mongoose.connect("mongodb://localhost:27017/unex_escuta");

app.get("/status", (req, res) => {
  res.json({ status: "API está rodando" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
