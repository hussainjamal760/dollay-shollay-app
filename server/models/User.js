const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  bodyType: {
    type: String
  },
  age: {
    type: Number
  },
  weight: {
    type: Number
  },
  goals: {
    type: [String]
  },
  experience: {
    type: Number
  },
  activityLevel: {
    type: String
  },
  constraints: {
    type: String
  },
  focusAreas: {
    type: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
