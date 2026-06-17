const express = require('express');
const auth = require('../middleware/auth');
const WorkoutLog = require('../models/WorkoutLog');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { planId, planName, date, exercises } = req.body;
    
    const newLog = new WorkoutLog({
      userId: req.user.id,
      planId,
      planName,
      date: date || Date.now(),
      exercises
    });

    const savedLog = await newLog.save();
    res.json({ success: true, log: savedLog });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error saving log' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const logs = await WorkoutLog.find({ userId: req.user.id }).sort({ date: -1 });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching logs' });
  }
});

router.post('/sync', auth, async (req, res) => {
  try {
    const { logs } = req.body;
    
    for (const log of logs) {
      if (log.server_id) {
        // Log already exists, skip or update
      } else {
        const newLog = new WorkoutLog({
          userId: req.user.id,
          planId: log.planId,
          planName: log.planName,
          date: log.date,
          exercises: log.exercises
        });
        await newLog.save();
      }
    }
    
    res.json({ success: true, message: 'Logs synced successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error syncing logs' });
  }
});

module.exports = router;
