require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const logsRoutes = require('./routes/logs');
const aiRoutes = require('./routes/ai');
const dietRoutes = require('./routes/diet');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/diet', dietRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fitcore server is running!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
