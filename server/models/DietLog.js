const mongoose = require('mongoose');

const dietLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  food_text: {
    type: String,
    required: true
  },
  protein: {
    type: Number,
    default: 0
  },
  carbs: {
    type: Number,
    default: 0
  },
  fat: {
    type: Number,
    default: 0
  },
  calories: {
    type: Number,
    default: 0
  }
});

const DietLog = mongoose.model('DietLog', dietLogSchema);
module.exports = DietLog;
