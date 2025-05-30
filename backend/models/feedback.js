const mongoose = require("mongoose");
const { Schema } = mongoose;

const feedbackSchema = new Schema({
  targetType: {
    type: String,
    required: true,
    enum: ["professor", "disciplina", "infraestrutura"],
    set: function (value) {
      const modelMap = {
        professor: "Professor",
        disciplina: "Discipline",
        infraestrutura: "Infrastructure",
      };
      this.targetModel = modelMap[value];
      return value;
    },
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
      min: 1,
      max: 5,
      required: function () {
        return ["professor", "disciplina"].includes(this.targetType);
      },
    },
    clarity: {
      type: Number,
      min: 1,
      max: 5,
      required: function () {
        return ["professor", "disciplina"].includes(this.targetType);
      },
    },
    infrastructureCondition: {
      type: Number,
      min: 1,
      max: 5,
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
          return /^\d{4}\.[12]$/.test(v);
        },
        message: "Semestre precisa ser no formato AAAA.S (ex.: 2025.1)",
      },
    },
    academicYear: {
      type: Number,
      required: true,
      min: 2015,
      max: new Date().getFullYear() + 1,
    },
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

// Método para estatísticas
feedbackSchema.statics.getStatsByTarget = function (targetType, targetId) {
  return this.aggregate([
    {
      $match: {
        targetType,
        targetId: new mongoose.Types.ObjectId(targetId),
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

// Índices
feedbackSchema.index({ targetType: 1, targetId: 1 });
feedbackSchema.index({ "author.userID": 1 });
feedbackSchema.index({ "metadata.academicYear": 1, "metadata.semester": 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Feedback", feedbackSchema);
