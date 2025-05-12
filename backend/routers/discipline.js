const express = require("express");
const router = express.Router();
const Discipline = require("../models/discipline");
const { check, validationResult } = require("express-validator");

//Busca todas as disciplinas
router.get("/", async (req, res) => {
  try {
    const disciplines = await Discipline.find().populate();
    res.status(200).json(disciplines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Busca todas disciplina por id
router.get("/:id", async (req, res) => {
  try {
    const discipline = await Discipline.findById(req.params.id).populate(
      "professors"
    );
    if (!discipline)
      return res.status(404).json({ error: "Disciplina não encontrada" });
    res.status(200).json(discipline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Buscar por nome
router.get("/name/:name", async (req, res) => {
  try {
    const discipline = await Discipline.findOne({
      name: { $regex: req.params.name, $options: "i" },
    }).populate("professors");
    if (!discipline)
      return res.status(404).json({ error: "Disciplina não encontrada" });
    res.status(200).json(discipline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Criar Disciplina
router.post(
  "/",
  [
    check("name", "O nome é obrigatório").notEmpty(),
    check("code", "O código é obrigatório").notEmpty(),
    check("courses", "Cursos deve ser uma lista").isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const newDiscipline = new Discipline(req.body);
      const saved = await newDiscipline.save();
      res.status(200).json(saved);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

//Atualizar disciplina
router.put("/:id", async (req, res) => {
  try {
    const update = await Discipline.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(update);
  } catch (err) {
    res.status(400).json({ error: error.message });
  }
});

//Deletar disciplina
router.delete("/:id", async (req, res) => {
  try {
    await Discipline.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Disciplina deletada com sucesso" });
  } catch (err) {
    res.status(400).json({ error: error.message });
  }
});
