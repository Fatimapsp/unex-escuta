const mongoose = requuire("mongoose");
const { Schema } = mongoose;

const feedbackSchema = new Schema({
  targetType: {
    type: String,
    required: true,
    enum: ["professor", "disciplina", "infraestrutura"],
  },
  targetId: {
    type: mongoose.ObjectId,
    required: true,
    validate: {
      validator: mongoose.isValidObjectId,
      message: "Invalid targetId format.",
    },
  },
  author: {
    userID: {
      type: mongoose.ObjectId,
      required: true,
      validate: {
        validator: mongoose.isValidObjectId,
        message: "Invalid userID format.",
      },
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  ratings: {
    teachingQuality: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "teachingQuality must be an integer.",
      },
    },
    clarity: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "clarity must be an integer.",
      },
    },
    insfraestructureCondition: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "insfraestructureCondition must be an integer.",
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
      type: Number,
      required: true,
    },
    academicYear: {
      type: Number,
      required: true,
      min: 2015,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
});

module.exports = mongoose.model("Feedback", feedbackSchema);
