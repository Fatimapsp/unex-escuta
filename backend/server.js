const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

require("dotenv").config();

const connectDB = require("../backend/config/db");


connectDB();

app.get("/status", (req, res) => {
  res.json({ status: "API está rodando" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
