require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Importar rotas
const userrouters = require("./routers/user");
const disciplinerouters = require("./routers/discipline");
const professorrouters = require("./routers/professor");
const feedbackrouters = require("./routers/feedback");
const infrarouters = require("./routers/infrastructure");
const authrouters = require("./routers/auth");

const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Conectar ao banco ANTES de tudo
connectDB();

// Middlewares de segurança
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: { error: "Muitas requisições. Tente novamente em 15 minutos." },
});
app.use(globalLimiter);

// Parser JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Development logging middleware
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Rotas
app.use("/api/auth", authrouters);
app.use("/api/users", userrouters);
app.use("/api/disciplines", disciplinerouters);
app.use("/api/professors", professorrouters);
app.use("/api/feedback", feedbackrouters);
app.use("/api/infrastructure", infrarouters);

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Algo deu errado!" });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
