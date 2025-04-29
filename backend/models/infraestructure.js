const mongoose = require("mongoose");
const { Schema } = mongoose;

const infrastructureSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
  },
  type: {
    type: String,
    required: true,
    enum: ["laboratory", "classroom", "library", "auditorium"],
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
});

module.exports = mongoose.model("Infraestructure", infrastructureSchema);
