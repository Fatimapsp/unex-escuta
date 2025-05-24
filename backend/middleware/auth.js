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
    // Buscar token no header Authorization
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Token de acesso requerido. Formato: Bearer <token>",
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        error: "Token não fornecido",
      });
    }

    // Verificar se o token não está em blacklist (implementar Redis futuramente)

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário no banco
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        error: "Token inválido - usuário não encontrado",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: "Conta desativada",
      });
    }

    // Atualizar último login (opcional - pode ser pesado)
    // await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

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

// Middleware para verificar se o usuário pode criar feedback sobre o target
const canCreateFeedback = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.body;
    const userId = req.user._id;

    // Verificar se já existe feedback do usuário para este target
    const existingFeedback = await require("../models/feedback").findOne({
      "author.userID": userId,
      targetType,
      targetId,
      "metadata.semester": req.body.metadata?.semester,
      "metadata.academicYear": req.body.metadata?.academicYear,
    });

    if (existingFeedback) {
      return res.status(400).json({
        error: "Você já enviou feedback para este item neste semestre",
      });
    }

    // Validar se o target existe
    let Model;
    switch (targetType) {
      case "professor":
        Model = require("../models/professor");
        break;
      case "disciplina":
        Model = require("../models/discipline");
        break;
      case "infraestrutura":
        Model = require("../models/infrastructure");
        break;
      default:
        return res.status(400).json({ error: "Tipo de target inválido" });
    }

    const target = await Model.findById(targetId);
    if (!target) {
      return res.status(404).json({ error: "Target não encontrado" });
    }

    next();
  } catch (error) {
    console.error("Erro ao verificar permissão de feedback:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

const generateToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      issuer: "unex-escuta-api",
    }
  );
};

const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Senha deve ter no mínimo ${minLength} caracteres`);
  }
  if (!hasUpperCase) {
    errors.push("Senha deve conter pelo menos uma letra maiúscula");
  }
  if (!hasLowerCase) {
    errors.push("Senha deve conter pelo menos uma letra minúscula");
  }
  if (!hasNumbers) {
    errors.push("Senha deve conter pelo menos um número");
  }
  if (!hasSpecialChar) {
    errors.push("Senha deve conter pelo menos um caractere especial");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Middleware para validar ObjectId
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
  canCreateFeedback,
  generateToken,
  validatePasswordStrength,
  validateObjectId,
  authLimiter,
};
