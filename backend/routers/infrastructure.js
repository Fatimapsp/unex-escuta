const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Infrastructure = require("../models/infrastructure");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", authenticate, async (req, res) => {
  try {
    const infraestruturas = await Infrastructure.find({ isActive: true });
    res.json(infraestruturas);
  } catch (error) {
    console.error("Erro ao buscar infraestrutura:", error);
    res.status(500).json({ message: "Erro ao buscar infraestrutura" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const infraestrutura = await Infrastructure.findById(id);
    if (!infraestrutura)
      return res.status(404).json({ message: "Infraestrutura não encontrada" });
    res.json(infraestrutura);
  } catch (error) {
    console.error("Erro ao buscar infraestrutura por ID:", error);
    res.status(500).json({ message: "Erro ao buscar pelo ID" });
  }
});

router.get("/name/:name", authenticate, async (req, res) => {
  try {
    const infraestrutura = await Infrastructure.findOne({
      name: { $regex: req.params.name, $options: "i" },
      isActive: true,
    });

    if (!infraestrutura) {
      return res.status(404).json({ message: "Infraestrutura não encontrada" });
    }

    res.json(infraestrutura);
  } catch (error) {
    console.error("Erro ao buscar infraestrutura por nome:", error);
    res.status(500).json({ message: "Erro ao buscar pelo nome" });
  }
});

router.post(
  "/",
  authenticate,
  authorize("admin"),
  [
    check("name")
      .notEmpty()
      .withMessage("O nome é obrigatório")
      .isString()
      .withMessage("O nome deve ser uma String")
      .isLength({ min: 3 })
      .withMessage("O nome deve ter no mínimo 3 caracteres"),

    check("type")
      .notEmpty()
      .withMessage("O tipo é obrigatório")
      .isIn([
        "laboratory",
        "classroom",
        "library",
        "auditorium",
        "cafeteria",
        "sports_facility",
      ])
      .withMessage("Tipo inválido"),

    check("location")
      .notEmpty()
      .withMessage("Localização é obrigatória")
      .isString()
      .withMessage("A localização deve ser uma String"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const newInfra = new Infrastructure(req.body);
      const saved = await newInfra.save();
      res.status(201).json({
        message: "Infraestrutura criada com sucesso",
        infrastructure: saved,
      });
    } catch (error) {
      console.error("Erro ao criar infraestrutura:", error);
      res.status(400).json({ message: "Erro ao criar infraestrutura" });
    }
  }
);

router.put("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const updated = await Infrastructure.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated)
      return res.status(404).json({ message: "Infraestrutura não encontrada" });

    res.json({
      message: "Infraestrutura atualizada com sucesso",
      infrastructure: updated,
    });
  } catch (error) {
    console.error("Erro ao atualizar infraestrutura:", error);
    res.status(400).json({ message: "Erro ao atualizar infraestrutura" });
  }
});

router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const deleted = await Infrastructure.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Infraestrutura não encontrada" });

    res.json({ message: "Infraestrutura deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar infraestrutura:", error);
    res.status(500).json({ message: "Erro ao deletar infraestrutura" });
  }
});

module.exports = router;
