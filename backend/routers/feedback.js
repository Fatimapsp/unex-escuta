const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Feedback = require("../models/feedback");
const {
  authenticate,
  authorize,
  canCreateFeedback,
} = require("../middleware/auth");

// Retorna feedbacks filtrados
router.get("/filter", authenticate, async (req, res) => {
  try {
    const { type, target, startDate, endDate, status } = req.query;

    const filtros = {};

    if (type) filtros.targetType = type;
    if (target) filtros.targetId = target;
    if (status) filtros.status = status;

    if (startDate || endDate) {
      filtros.createdAt = {};
      if (startDate) filtros.createdAt.$gte = new Date(startDate);
      if (endDate) filtros.createdAt.$lte = new Date(endDate);
    }

    //Paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const resultados = await Feedback.find(filtros)
      .populate("targetId")
      .populate("author.userID", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments(filtros);

    res.status(200).json({
      feedbacks: resultados,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar feedbacks:", error);
    res.status(500).json({ error: "Erro ao buscar feedbacks com filtros" });
  }
});

// Estatísticas
router.get("/stats", authenticate, async (req, res) => {
  try {
    const { targetType } = req.query;

    const matchStage = { status: "approved" };
    if (targetType) matchStage.targetType = targetType;

    const stats = await Feedback.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$targetType",
          avgTeachingQuality: {
            $avg: {
              $cond: [
                { $ne: ["$ratings.teachingQuality", null] },
                "$ratings.teachingQuality",
                null,
              ],
            },
          },
          avgClarity: {
            $avg: {
              $cond: [
                { $ne: ["$ratings.clarity", null] },
                "$ratings.clarity",
                null,
              ],
            },
          },
          avgInfrastructure: {
            $avg: {
              $cond: [
                { $ne: ["$ratings.infrastructureCondition", null] },
                "$ratings.infrastructureCondition",
                null,
              ],
            },
          },
          totalFeedbacks: { $sum: 1 },
        },
      },
    ]);

    res.json(stats);
  } catch (error) {
    console.error("Erro ao gerar estatísticas:", error);
    res.status(500).json({ error: "Erro ao gerar estatísticas." });
  }
});

// Retorna todos os feedbacks
router.get("/", authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find()
      .populate("targetId")
      .populate("author.userID", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments();

    res.status(200).json({
      feedbacks,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar feedbacks:", error);
    res.status(500).json({ error: "Erro ao buscar feedbacks" });
  }
});

// Retorna um feedback específico pelo ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate("targetId")
      .populate("author.userID", "name email");

    if (!feedback) {
      return res.status(404).json({ error: "Feedback não encontrado" });
    }
    res.status(200).json(feedback);
  } catch (error) {
    console.error("Erro ao buscar feedback:", error);
    res.status(500).json({ error: "Erro ao buscar feedback pelo ID" });
  }
});

// Validações
router.post(
  "/",
  authenticate,
  canCreateFeedback,
  [
    check("targetType")
      .notEmpty()
      .withMessage("TargetType é obrigatório")
      .isIn(["professor", "disciplina", "infraestrutura"])
      .withMessage(
        "TargetType deve ser: professor, disciplina ou infraestrutura"
      ),

    check("targetId")
      .notEmpty()
      .withMessage("TargetId é obrigatório")
      .isMongoId()
      .withMessage("TargetId deve ser um ObjectId válido"),

    check("ratings.teachingQuality")
      .if((value, { req }) =>
        ["professor", "disciplina"].includes(req.body.targetType)
      )
      .isInt({ min: 1, max: 5 })
      .withMessage("Teaching Quality deve ser um valor entre 1 e 5"),

    check("ratings.clarity")
      .if((value, { req }) =>
        ["professor", "disciplina"].includes(req.body.targetType)
      )
      .isInt({ min: 1, max: 5 })
      .withMessage("Clarity deve ser um valor entre 1 e 5"),

    check("ratings.infrastructureCondition")
      .if((value, { req }) => req.body.targetType === "infraestrutura")
      .isInt({ min: 1, max: 5 })
      .withMessage("Infraestrutura deve ser um valor entre 1 e 5"),

    check("comment")
      .notEmpty()
      .withMessage("Comentário é obrigatório")
      .isLength({ max: 500 })
      .withMessage("Comentário deve ter no máximo 500 caracteres"),

    check("metadata.semester")
      .notEmpty()
      .withMessage("Semestre é obrigatório")
      .matches(/^\d{4}\.[12]$/)
      .withMessage("Semestre deve estar no formato YYYY.N (ex: 2025.1)"),

    check("metadata.academicYear")
      .isInt({ min: 2015, max: new Date().getFullYear() + 1 })
      .withMessage("Ano acadêmico inválido"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: errors.array(),
      });
    }

    try {
      // Map targetType to targetModel before creating the feedback
      const modelMap = {
        professor: "Professor",
        disciplina: "Discipline",
        infraestrutura: "Infrastructure",
      };

      const feedback = new Feedback({
        ...req.body,
        targetModel: modelMap[req.body.targetType], // Set targetModel explicitly
        author: {
          userID: req.user._id,
          isAnonymous: req.body.isAnonymous || false,
        },
      });

      await feedback.save();

      // Populate os dados antes de retornar
      await feedback.populate("targetId");

      res.status(201).json({
        message: "Feedback criado com sucesso",
        feedback,
      });
    } catch (error) {
      console.error("Erro ao criar feedback:", error);
      res.status(500).json({ error: "Erro ao criar feedback" });
    }
  }
);

// Apenas admin ou autor pode deletar
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: "Feedback não encontrado" });
    }

    // Verifica se é o autor ou admin
    const isAuthor =
      feedback.author.userID.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res
        .status(403)
        .json({ error: "Sem permissão para deletar este feedback" });
    }

    await Feedback.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Feedback excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir feedback:", error);
    res.status(500).json({ error: "Erro ao excluir feedback" });
  }
});

// Rota para aprovar/rejeitar feedback (apenas admin)
router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  [
    check("status")
      .isIn(["pending", "approved", "rejected"])
      .withMessage("Status deve ser: pending, approved ou rejected"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const feedback = await Feedback.findByIdAndUpdate(
        req.params.id,
        {
          status: req.body.status,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!feedback) {
        return res.status(404).json({ error: "Feedback não encontrado" });
      }

      res.json({
        message: "Status do feedback atualizado",
        feedback,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      res.status(500).json({ error: "Erro ao atualizar status do feedback" });
    }
  }
);

module.exports = router;
