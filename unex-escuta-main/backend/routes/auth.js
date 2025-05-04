const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { generateToken } = require("../utils/jwt");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Credenciais inválidas" });

    // Comparar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ message: "Credenciais inválidas" });

    // Gerar token JWT com expiração de 2 horas
    const token = generateToken(user);

    // Retornar informações do usuário junto ao token (menos a senha)
    res.json({
      message: "Autenticação bem-sucedida",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erro ao autenticar", error });
  }
});

module.exports = router;