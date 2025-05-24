require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Muitas requisições. Tente novamente em 15 minutos." },
});
app.use(globalLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Test each router one by one
console.log("Testing auth router...");
try {
  const authrouters = require("./routers/auth");
  app.use("/api/auth", authrouters);
  console.log("✅ Auth router loaded successfully");
} catch (error) {
  console.log("❌ Auth router failed:", error.message);
}

console.log("Testing user router...");
try {
  const userrouters = require("./routers/user");
  app.use("/api/users", userrouters);
  console.log("✅ User router loaded successfully");
} catch (error) {
  console.log("❌ User router failed:", error.message);
}

console.log("Testing discipline router...");
try {
  const disciplinerouters = require("./routers/discipline");
  app.use("/api/disciplines", disciplinerouters);
  console.log("✅ Discipline router loaded successfully");
} catch (error) {
  console.log("❌ Discipline router failed:", error.message);
}

console.log("Testing professor router...");
try {
  const professorrouters = require("./routers/professor");
  app.use("/api/professors", professorrouters);
  console.log("✅ Professor router loaded successfully");
} catch (error) {
  console.log("❌ Professor router failed:", error.message);
}

console.log("Testing feedback router...");
try {
  const feedbackrouters = require("./routers/feedback");
  app.use("/api/feedback", feedbackrouters);
  console.log("✅ Feedback router loaded successfully");
} catch (error) {
  console.log("❌ Feedback router failed:", error.message);
}

console.log("Testing infrastructure router...");
try {
  const infrarouters = require("./routers/infrastructure");
  app.use("/api/infrastructure", infrarouters);
  console.log("✅ Infrastructure router loaded successfully");
} catch (error) {
  console.log("❌ Infrastructure router failed:", error.message);
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Algo deu errado!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Debug server running on port ${PORT}`);
});
