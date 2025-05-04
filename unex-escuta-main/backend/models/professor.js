const mongoose = require("mongoose");
const { Schema } = mongoose;

const professorSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
  },
  courses: {
    type: [String],
    default: [],
    required: true,
  },
  disciplines: {
    type: [mongoose.ObjectId],
    default: [],
    validate: {
      validator: function (disciplines) {
        return disciplines.every((discipline) =>
          mongoose.isValidObjectId(discipline)
        );
      },
      message: "All disciplines must have valid ObjectId values.",
    },
  },
});

module.exports = mongoose.model("Professor", professorSchema);
