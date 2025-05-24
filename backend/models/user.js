const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email inválido"],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false, // Por padrão não incluir nas consultas
  },
  registration: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["estudante", "professor", "admin"],
    default: "estudante",
  },
  courses: {
    type: [String],
    default: [],
    required: function () {
      return this.role === "estudante";
    },
  },
  isActive: {
    type: Boolean,
    default: true,
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

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.generateAuthToken = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    registration: this.registration,
    role: this.role,
    courses: this.courses,
    isActive: this.isActive,
    profilePicture: this.profilePicture,
    createdAt: this.createdAt,
  };
};

userSchema.pre("findOneAndUpdate", function () {
  this.set({ updatedAt: new Date() });
});

userSchema.index({ email: 1 });
userSchema.index({ registration: 1 });
userSchema.index({ role: 1 });
userSchema.index({ courses: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model("User", userSchema);
