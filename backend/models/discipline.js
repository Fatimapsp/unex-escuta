const mongoose = require("mongoose");
const { Schema } = mongoose;

const disciplineSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    minlength: 3,
  },
  department: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  courses: {
    type: [String],
    required: true,
    default: [],
  },
  professors: {
    type: [mongoose.ObjectId],
    default: [],
    validate: {
      validator: function (professors) {
        return professors.every((professor) =>
          mongoose.isValidObjectId(professor)
        );
      },
      message: "All professors must have valid ObjectId values.",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

disciplineSchema.index({ name: 1 });
disciplineSchema.index({ department: 1 });
disciplineSchema.index({ professors: 1 });

module.exports = mongoose.model("Discipline", disciplineSchema);
