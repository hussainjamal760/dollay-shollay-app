const mongoose = require('mongoose');

const logExerciseSchema = new mongoose.Schema({
  muscle: { type: String, required: true },
  name: { type: String, required: true },
  weightLifted: { type: Number },
  sets: { type: Number },
  reps: { type: Number }
});

const workoutLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  exercises: [logExerciseSchema]
});

const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);
module.exports = WorkoutLog;
