const jwt = require("jsonwebtoken");

const SECRET_KEY = "seuSegredoSuperSeguro"; // Variável de ambiente

// Gerar token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    SECRET_KEY,
    { expiresIn: "2h" } // Expiração do token
  );
};

// Verificar e decodificar token JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null; // Token inválido ou expirado
  }
};

module.exports = { generateToken, verifyToken };