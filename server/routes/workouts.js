const express = require('express');
const auth = require('../middleware/auth');
const WorkoutPlan = require('../models/WorkoutPlan');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { name, isActive, days } = req.body;
    
    if (isActive) {
      await WorkoutPlan.updateMany({ userId: req.user.id }, { isActive: false });
    }

    const newPlan = new WorkoutPlan({
      userId: req.user.id,
      name,
      isActive: isActive || false,
      days
    });

    const savedPlan = await newPlan.save();
    res.json({ success: true, workoutPlan: savedPlan });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error saving workout plan' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const plans = await WorkoutPlan.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, workoutPlans: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching workout plans' });
  }
});

router.post('/sync', auth, async (req, res) => {
  try {
    const { plans } = req.body;
    
    for (const plan of plans) {
      if (plan.isActive) {
        await WorkoutPlan.updateMany({ userId: req.user.id }, { isActive: false });
      }
      
      if (plan.server_id) {
        await WorkoutPlan.findOneAndUpdate(
          { _id: plan.server_id, userId: req.user.id },
          { name: plan.name, isActive: plan.isActive, days: plan.days }
        );
      } else {
        const newPlan = new WorkoutPlan({
          userId: req.user.id,
          name: plan.name,
          isActive: plan.isActive,
          days: plan.days
        });
        await newPlan.save();
      }
    }
    
    res.json({ success: true, message: 'Workouts synced successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error syncing workouts' });
  }
});

module.exports = router;
