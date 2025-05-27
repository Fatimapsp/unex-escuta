const jwt = require("jsonwebtoken");
const User = require("../models/user");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

// Rate limiting para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas por IP
  message: {
    error: "Muitas tentativas de autenticação. Tente novamente em 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Token de acesso requerido. Formato: Bearer <token>",
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        error: "Token inválido - usuário não encontrado",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token inválido" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }

    console.error("Erro na autenticação:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acesso negado. Roles permitidas: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

const authorizeOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Usuário não autenticado",
    });
  }

  const isOwner = req.user._id.toString() === req.params.id;
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      error: "Acesso negado. Você só pode acessar seus próprios dados",
    });
  }

  next();
};

const generateToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      issuer: "unex-escuta-api",
    }
  );
};

const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: `${paramName} inválido`,
        received: id,
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwnerOrAdmin,
  generateToken,
  validateObjectId,
  authLimiter,
};
