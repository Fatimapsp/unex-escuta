const express = require("express");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const User = require("../models/user");
const { generateToken } = require("../utils/jwt"); // Importando função para gerar token

const router = express.Router();

// Esquema de validação com Joi
const userSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  registration: Joi.string().required(),
  role: Joi.string().valid("estudante", "professor", "admin"),
  courses: Joi.array().items(Joi.string()).required(),
});

// Rota para criação de usuários
router.post("/", async (req, res) => {
  try {
    // Validação dos dados recebidos
    const { error } = userSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, email, password, registration, role, courses } = req.body;

    // Verificar se o email já está cadastrado
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email já cadastrado!" });

    // Gerar hash da senha antes de salvar no banco
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar novo usuário e salvar no banco
    const newUser = new User({ name, email, password: hashedPassword, registration, role, courses });
    await newUser.save();

    // Gerar token JWT
    const token = generateToken(newUser);

    res.status(201).json({ message: "Usuário criado com sucesso!", token });
  } catch (error) {
    res.status(500).json({ message: "Erro interno do servidor", error });
  }
});

module.exports = router;