const express = require("express");
const router = express.Router();
const Professor = require("../models/professor");
const { check, validationResult } = require("express-validator");

//Buscar todos os professores
router.get("/", async (req, res) => {
  try {
    const professors = await Professor.find().populate();
    res.status(200).json(professors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Buscar professor por id
router.get("/:id", async (req, res) => {
  try {
    const professor = await Professor.findById(req.params.id);
    if (!professor)
      return res.status(404).json({ error: "Professor não encontrado" });
    res.status(200).json(professor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Buscar professor por nome
router.get("/name/:name", async (req, res) => {
  try {
    const professor = await Professor.findOne({
      name: { $regex: req.params.name, $options: "i" },
    });
    if (!professor)
      return res.status(404).json({ error: "Professor não encontrado" });
    res.status(200).json(professor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Criar Professor
router.post(
  "/",
  [
    check("name", "Nome é obrigatório").notEmpty(),
    check("courses", "Cursos deve ser um array").isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const newProfessor = new Professor(req.body);
      const saved = await newProfessor.save();
      res.status(200).json(saved);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

//Atualizar professor
router.put("/:id", async (req, res) => {
  try {
    const update = await Professor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(update);
  } catch (err) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Professor.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Professor deletado com sucesso" });
  } catch (err) {
    res.status(400).json({ error: error.message });
  }
});
