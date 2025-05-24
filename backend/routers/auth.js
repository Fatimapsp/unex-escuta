const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const User = require("../models/user");
const {
  generateToken,
  validatePasswordStrength,
} = require("../middleware/auth");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: {
    error: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/register",
  [
    // Validações
    check("name")
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Nome deve ter entre 3 e 50 caracteres")
      .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
      .withMessage("Nome deve conter apenas letras e espaços"),

    check("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Email deve ser válido"),

    check("password")
      .isLength({ min: 6 })
      .withMessage("Senha deve ter no mínimo 6 caracteres"),

    check("registration")
      .trim()
      .isNumeric()
      .isLength({ min: 4, max: 20 })
      .withMessage("Matrícula deve conter apenas números (4-20 dígitos)"),

    check("role")
      .optional()
      .isIn(["estudante", "professor", "admin"])
      .withMessage("Role deve ser: estudante, professor ou admin"),

    check("courses").isArray().withMessage("Cursos deve ser um array"),
  ],
  async (req, res) => {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: errors.array(),
      });
    }

    const { name, email, password, registration, role, courses } = req.body;

    try {
      // Verificar se usuário já existe
      let existingUser = await User.findOne({
        $or: [{ email }, { registration }],
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).json({
            error: "Email já está em uso",
          });
        }
        if (existingUser.registration === registration) {
          return res.status(400).json({
            error: "Matrícula já está em uso",
          });
        }
      }

      // Validar força da senha
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: "Senha não atende aos critérios de segurança",
          details: passwordValidation.errors,
        });
      }

      // Criar usuário
      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password, // Será hasheada automaticamente pelo middleware
        registration: registration.trim(),
        role: role || "estudante",
        courses: courses || [],
      });

      await user.save();

      // Gerar token
      const token = generateToken(user._id);

      // Retornar dados
      const userData = user.generateAuthToken();

      res.status(201).json({
        message: "Usuário criado com sucesso",
        token,
        user: userData,
      });
    } catch (error) {
      console.error("Erro no registro:", error);

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          error: `${field === "email" ? "Email" : "Matrícula"} já está em uso`,
        });
      }

      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({
          error: "Dados inválidos",
          details: validationErrors,
        });
      }

      res.status(500).json({
        error: "Erro interno do servidor",
      });
    }
  }
);

router.post(
  "/login",
  authLimiter,
  [
    check("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Email deve ser válido"),

    check("password").notEmpty().withMessage("Senha é obrigatória"),
  ],
  async (req, res) => {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    try {
      // Buscar usuário
      const user = await User.findOne({
        email: email.toLowerCase().trim(),
      }).select("+password");

      if (!user) {
        return res.status(401).json({
          error: "Credenciais inválidas",
        });
      }

      // Verificar se conta está ativa
      if (!user.isActive) {
        return res.status(401).json({
          error: "Conta desativada. Entre em contato com o administrador.",
        });
      }

      // Comparar senha
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Credenciais inválidas",
        });
      }

      // Gerar token
      const token = generateToken(user._id);

      // Retornar dados
      const userData = user.generateAuthToken();

      res.json({
        message: "Login realizado com sucesso",
        token,
        user: userData,
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
      });
    }
  }
);

// VERIFICAR TOKEN
router.get(
  "/verify",
  require("../middleware/auth").authenticate,
  (req, res) => {
    res.json({
      message: "Token válido",
      user: req.user.generateAuthToken(),
    });
  }
);

// LOGOUT
router.post("/logout", (req, res) => {
  res.json({
    message: "Logout realizado com sucesso",
  });
});

module.exports = router;
