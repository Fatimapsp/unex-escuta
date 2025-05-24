const mongoose = require("mongoose");
const { Schema } = mongoose;

const feedbackSchema = new Schema({
  targetType: {
    type: String,
    required: true,
    enum: ["professor", "disciplina", "infraestrutura"],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "targetModel",
  },
  targetModel: {
    type: String,
    required: true,
    enum: ["Professor", "Discipline", "Infrastructure"],
  },
  author: {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  ratings: {
    teachingQuality: {
      type: Number,
      min: [1, "Nota mínima é 1"],
      max: [5, "Nota máxima é 5"],
      validate: {
        validator: Number.isInteger,
        message: "Nota deve ser um número inteiro",
      },
      required: function () {
        return ["professor", "disciplina"].includes(this.targetType);
      },
    },
    clarity: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "clarity must be an integer.",
      },
      required: function () {
        return ["professor", "disciplina"].includes(this.targetType);
      },
    },
    infrastructureCondition: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "infrastructureCondition must be an integer.",
      },
      required: function () {
        return this.targetType === "infraestrutura";
      },
    },
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  metadata: {
    semester: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{4}\.[12]$/.test(v); // Formato: 2025.1 ou 2025.2
        },
        message: "Semester must be in format YYYY.N (e.g., 2025.1)",
      },
    },
    academicYear: {
      type: Number,
      required: true,
      min: 2015,
      max: new Date().getFullYear() + 1,
    },
  },
  // Campo de status para moderar feedbacks
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware para definir targetModel
feedbackSchema.pre("save", function (next) {
  const modelMap = {
    professor: "Professor",
    disciplina: "Discipline",
    infraestrutura: "Infrastructure",
  };
  this.targetModel = modelMap[this.targetType];
  this.updatedAt = new Date();
  next();
});

// Índices
feedbackSchema.index({ targetType: 1, targetId: 1 });
feedbackSchema.index({ "author.userID": 1 });
feedbackSchema.index({ "metadata.academicYear": 1, "metadata.semester": 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ createdAt: -1 }); // Para ordenação por data

//Método para estatísticas
feedbackSchema.statics.getStatsByTarget = function (targetType, targetId) {
  return this.aggregate([
    {
      $match: {
        targetType,
        targetId: new mongoose.Types.ObjectId(targetId),
        status: "approved",
      },
    },
    {
      $group: {
        _id: null,
        avgTeachingQuality: { $avg: "$ratings.teachingQuality" },
        avgClarity: { $avg: "$ratings.clarity" },
        avgInfrastructure: { $avg: "$ratings.infrastructureCondition" },
        totalFeedbacks: { $sum: 1 },
      },
    },
  ]);
};

module.exports = mongoose.model("Feedback", feedbackSchema);
