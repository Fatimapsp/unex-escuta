const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const User = require("../models/user");
const { generateToken } = require("../middleware/auth");

// Registro de usuário
router.post(
  "/register",
  [
    check("name").notEmpty().withMessage("Nome é obrigatório"),
    check("email").isEmail().withMessage("Email deve ser válido"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Senha deve ter no mínimo 6 caracteres"),
    check("registration").notEmpty().withMessage("Matrícula é obrigatória"),
  ],
  async (req, res) => {
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
          return res.status(400).json({ error: "Email já está em uso" });
        }
        if (existingUser.registration === registration) {
          return res.status(400).json({ error: "Matrícula já está em uso" });
        }
      }

      // Criar usuário
      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        registration: registration.trim(),
        role: role || "estudante",
        courses: courses || [],
      });

      await user.save();

      // Gerar token
      const token = generateToken(user._id);
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

      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// Login
router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Email deve ser válido"),
    check("password").notEmpty().withMessage("Senha é obrigatória"),
  ],
  async (req, res) => {
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
        return res.status(401).json({ error: "Credenciais inválidas" });
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
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      // Gerar token
      const token = generateToken(user._id);
      const userData = user.generateAuthToken();

      res.json({
        message: "Login realizado com sucesso",
        token,
        user: userData,
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// Verificar token
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

// Logout
router.post("/logout", (req, res) => {
  res.json({ message: "Logout realizado com sucesso" });
});

module.exports = router;
