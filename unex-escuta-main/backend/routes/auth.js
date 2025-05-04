const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");

const router = express.Router();

// Chave secreta para gerar tokens (armazenada em variável de ambiente)
const SECRET_KEY = "seuSegredoSuperSeguro";  

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Credenciais inválidas" });

    // Comparar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ message: "Credenciais inválidas" });

    // Gerar token JWT
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: "2h" });

    res.json({ token, message: "Autenticação bem-sucedida" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao autenticar", error });
  }
});

module.exports = router;