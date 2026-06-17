require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fitcore server is running!' });
});

app.post('/api/ai/coach', async (req, res) => {
  try {
    const { prompt } = req.body;
    res.json({ 
      success: true, 
      message: "This is a mock response from the AI coach.",
      reply: `You said: ${prompt}`
    });
  } catch (error) {
    console.error('AI Coach error:', error);
    res.status(500).json({ success: false, error: 'Failed to communicate with AI coach.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
