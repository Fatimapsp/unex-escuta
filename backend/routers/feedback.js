const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const Feedback = require("../models/feedback");
const { authenticate, authorize } = require("../middleware/auth");

// Listar feedbacks com filtros
router.get("/", authenticate, async (req, res) => {
  try {
    const {
      type,
      target,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const filtros = {};
    if (type) filtros.targetType = type;
    if (target) filtros.targetId = target;

    if (startDate || endDate) {
      filtros.createdAt = {};
      if (startDate) filtros.createdAt.$gte = new Date(startDate);
      if (endDate) filtros.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let feedbacks = await Feedback.find(filtros)
      .populate("targetId")
      .populate("author.userID", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    feedbacks = feedbacks.map((feedback) => {
      const fb = feedback.toObject();
      if (fb.author.isAnonymous) {
        delete fb.author.userID;
      }
      return fb;
    });

    const total = await Feedback.countDocuments(filtros);

    res.json({
      feedbacks,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar feedbacks:", error);
    res.status(500).json({ error: "Erro ao buscar feedbacks" });
  }
});

// Buscar feedback por ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    let feedback = await Feedback.findById(req.params.id)
      .populate("targetId")
      .populate("author.userID", "name email");

    if (!feedback) {
      return res.status(404).json({ error: "Feedback não encontrado" });
    }

    feedback = feedback.toObject();

    if (feedback.author.isAnonymous) {
      delete feedback.author.userID;
    }

    res.json(feedback);
  } catch (error) {
    console.error("Erro ao buscar feedback:", error);
    res.status(500).json({ error: "Erro ao buscar feedback" });
  }
});

// Criar feedback
router.post(
  "/",
  authenticate,
  [
    check("targetType")
      .isIn(["professor", "disciplina", "infraestrutura"])
      .withMessage(
        "TargetType deve ser: professor, disciplina ou infraestrutura"
      ),
    check("targetId")
      .isMongoId()
      .withMessage("TargetId deve ser um ObjectId válido"),
    check("comment")
      .notEmpty()
      .withMessage("Comentário é obrigatório")
      .isLength({ max: 500 })
      .withMessage("Comentário deve ter no máximo 500 caracteres"),
    check("metadata.semester")
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
      const feedback = new Feedback({
        ...req.body,
        author: {
          userID: req.user._id,
          isAnonymous: req.body.isAnonymous || false,
        },
      });

      await feedback.save();
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

// Deletar feedback (autor ou admin)
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
      return res.status(403).json({
        error: "Sem permissão para deletar este feedback",
      });
    }

    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: "Feedback excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir feedback:", error);
    res.status(500).json({ error: "Erro ao excluir feedback" });
  }
});

// Estatísticas gerais
router.get("/stats/general", authenticate, async (req, res) => {
  try {
    const { targetType } = req.query;

    const matchStage = {};
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

    res.json({ stats });
  } catch (error) {
    console.error("Erro ao gerar estatísticas:", error);
    res.status(500).json({ error: "Erro ao gerar estatísticas" });
  }
});

// Estatísticas por semestre
router.get("/stats/semester", authenticate, async (req, res) => {
  try {
    const { year, targetType } = req.query;

    const matchStage = {};
    if (targetType) matchStage.targetType = targetType;
    if (year) matchStage["metadata.academicYear"] = parseInt(year);

    const stats = await Feedback.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            semester: "$metadata.semester",
            targetType: "$targetType",
          },
          avgTeachingQuality: { $avg: "$ratings.teachingQuality" },
          avgClarity: { $avg: "$ratings.clarity" },
          avgInfrastructure: { $avg: "$ratings.infrastructureCondition" },
          totalFeedbacks: { $sum: 1 },
        },
      },
      { $sort: { "_id.semester": -1, "_id.targetType": 1 } },
    ]);

    res.json({ stats });
  } catch (error) {
    console.error("Erro ao gerar estatísticas por semestre:", error);
    res.status(500).json({ error: "Erro ao gerar estatísticas" });
  }
});

// Ranking (top professores/disciplinas)
router.get("/stats/ranking", authenticate, async (req, res) => {
  try {
    const {
      targetType = "professor",
      limit = 10,
      minFeedbacks = 3,
    } = req.query;

    const pipeline = [
      {
        $match: {
          targetType,
          $or: [
            { "ratings.teachingQuality": { $exists: true } },
            { "ratings.clarity": { $exists: true } },
          ],
        },
      },
      {
        $group: {
          _id: "$targetId",
          avgTeachingQuality: { $avg: "$ratings.teachingQuality" },
          avgClarity: { $avg: "$ratings.clarity" },
          totalFeedbacks: { $sum: 1 },
        },
      },
      {
        $match: {
          totalFeedbacks: { $gte: parseInt(minFeedbacks) },
        },
      },
      {
        $addFields: {
          overallRating: {
            $avg: [
              { $ifNull: ["$avgTeachingQuality", 0] },
              { $ifNull: ["$avgClarity", 0] },
            ],
          },
        },
      },
      { $sort: { overallRating: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: targetType === "professor" ? "professors" : "disciplines",
          localField: "_id",
          foreignField: "_id",
          as: "targetInfo",
        },
      },
    ];

    const ranking = await Feedback.aggregate(pipeline);

    res.json({
      message: `Top ${targetType}s ranking`,
      data: ranking,
    });
  } catch (error) {
    console.error("Erro ao gerar ranking:", error);
    res.status(500).json({ error: "Erro ao gerar ranking" });
  }
});

module.exports = router;
