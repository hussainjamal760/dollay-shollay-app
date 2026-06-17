const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  muscle: { type: String, required: true },
  name: { type: String, required: true },
  weightLifted: { type: Number },
  sets: { type: Number },
  reps: { type: Number }
});

const daySchema = new mongoose.Schema({
  dayOfWeek: { type: String, required: true },
  muscles: { type: [String], required: true },
  exercises: [exerciseSchema]
});

const workoutPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  days: [daySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);
module.exports = WorkoutPlan;
