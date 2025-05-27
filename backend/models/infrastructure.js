const mongoose = require("mongoose");
const { Schema } = mongoose;

const infrastructureSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100,
  },
  type: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
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

infrastructureSchema.pre("findOneAndUpdate", function () {
  this.set({ updatedAt: new Date() });
});

infrastructureSchema.index({ location: 1 });
infrastructureSchema.index({ type: 1 });
infrastructureSchema.index({ isActive: 1 });
infrastructureSchema.index({ name: 1 });

module.exports = mongoose.model("Infrastructure", infrastructureSchema);
