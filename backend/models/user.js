const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  registration: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["estudante", "professor", "admin"],
    default: "estudante",
  },
  courses: {
    type: [String],
    default: [],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ courses: 1 });

module.exports = mongoose.model("User", userSchema);
