const express = require('express');
const auth = require('../middleware/auth');
const DietLog = require('../models/DietLog');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const logs = await DietLog.find({ userId: req.user.id }).sort({ date: -1 });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching diet logs' });
  }
});

router.post('/sync', auth, async (req, res) => {
  try {
    const { logs } = req.body;
    
    for (const log of logs) {
      if (log.server_id) {
        await DietLog.findOneAndUpdate(
          { _id: log.server_id, userId: req.user.id },
          {
            date: log.date,
            food_text: log.food_text,
            protein: log.protein,
            carbs: log.carbs,
            fat: log.fat,
            calories: log.calories
          }
        );
      } else {
        const newLog = new DietLog({
          userId: req.user.id,
          date: log.date,
          food_text: log.food_text,
          protein: log.protein,
          carbs: log.carbs,
          fat: log.fat,
          calories: log.calories
        });
        await newLog.save();
      }
    }
    
    res.json({ success: true, message: 'Diet logs synced successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error syncing diet logs' });
  }
});

module.exports = router;
