const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = new User({
      firstName,
      lastName,
      email,
      passwordHash
    });

    await user.save();

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ success: true, token, user: { id: user.id, email, firstName, lastName } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ success: true, token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const auth = require('../middleware/auth');

router.post('/sync', auth, async (req, res) => {
  try {
    const { id, firstName, lastName, email } = req.body;
    
    if (req.user.id !== id) {
       return res.status(401).json({ success: false, message: 'Unauthorized sync attempt' });
    }
    
    await User.findByIdAndUpdate(id, { firstName, lastName, email });
    res.json({ success: true, message: 'Synced successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error during sync' });
  }
});

module.exports = router;
