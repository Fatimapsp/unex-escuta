const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const {
  authenticate,
  authorize,
  authorizeOwnerOrAdmin,
} = require("../middleware/auth");

// LISTAR USUÁRIOS - Apenas ADMIN
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive } = req.query;

    // Filtros
    const filters = {};
    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === "true";

    // Paginação
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: "-password", // Nunca retornar senhas
      sort: { createdAt: -1 },
    };

    const users = await User.find(filters)
      .select("-password")
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await User.countDocuments(filters);

    res.json({
      users,
      pagination: {
        current: options.page,
        pages: Math.ceil(total / options.limit),
        total,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// BUSCAR USUÁRIO POR ID - Próprio usuário ou ADMIN
router.get("/:id", authenticate, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ error: "ID inválido" });
    }

    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// PERFIL DO USUÁRIO LOGADO
router.get("/me/profile", authenticate, (req, res) => {
  res.json(req.user);
});

// ATUALIZAR USUÁRIO - Próprio usuário ou ADMIN
router.put(
  "/:id",
  authenticate,
  authorizeOwnerOrAdmin,
  [
    check("name")
      .optional()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Nome deve ter entre 3 e 50 caracteres"),

    check("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Email deve ser válido"),

    check("courses")
      .optional()
      .isArray()
      .withMessage("Cursos deve ser um array"),

    check("role")
      .optional()
      .isIn(["estudante", "professor", "admin"])
      .withMessage("Role deve ser: estudante, professor ou admin"),
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
      const userId = req.params.id;
      const updateData = { ...req.body };

      // Remover campos que não devem ser atualizados
      delete updateData.password;
      delete updateData.registration;
      delete updateData.createdAt;

      // Apenas admin pode alterar role e isActive
      if (req.user.role !== "admin") {
        delete updateData.role;
        delete updateData.isActive;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          ...updateData,
          updatedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({
        message: "Usuário atualizado com sucesso",
        user,
      });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);

      if (error.code === 11000) {
        return res.status(400).json({ error: "Email já está em uso" });
      }

      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({
          error: "Dados inválidos",
          details: validationErrors,
        });
      }

      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// ALTERAR SENHA - Próprio usuário apenas
router.put(
  "/:id/password",
  authenticate,
  authorizeOwnerOrAdmin,
  [
    check("currentPassword")
      .notEmpty()
      .withMessage("Senha atual é obrigatória"),

    check("newPassword")
      .isLength({ min: 6 })
      .withMessage("Nova senha deve ter no mínimo 6 caracteres"),

    check("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Confirmação de senha não confere");
      }
      return true;
    }),
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
      const { currentPassword, newPassword } = req.body;

      // Buscar usuário com senha
      const user = await User.findById(req.params.id).select("+password");

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );

      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: "Senha atual incorreta" });
      }

      // Atualizar senha (será hasheada automaticamente)
      user.password = newPassword;
      user.updatedAt = new Date();
      await user.save();

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// DESATIVAR USUÁRIO - Apenas ADMIN
router.put(
  "/:id/deactivate",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          isActive: false,
          updatedAt: new Date(),
        },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({
        message: "Usuário desativado com sucesso",
        user,
      });
    } catch (error) {
      console.error("Erro ao desativar usuário:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// DELETAR USUÁRIO - Apenas ADMIN
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ message: "Usuário removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
