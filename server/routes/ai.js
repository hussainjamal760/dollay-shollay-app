const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key'
});

router.post('/chat', async (req, res) => {
  try {
    const { prompt, history } = req.body;
    
    let messages = [
      {
        role: "system",
        content: "You are an expert fitness and bodybuilding coach named 'Dollay-Shollay Coach'. You help users build muscle, lose fat, and improve their diet. Respond concisely and energetically."
      }
    ];

    if (history && Array.isArray(history)) {
      messages = messages.concat(history);
    } else {
      messages.push({ role: "user", content: prompt });
    }

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 500,
    });

    res.json({
      success: true,
      reply: completion.choices[0]?.message?.content || "I couldn't generate a response."
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to communicate with AI coach.' });
  }
});

router.post('/suggest-overload', async (req, res) => {
  try {
    const { exerciseName, history } = req.body;

    const messages = [
      {
        role: "system",
        content: `You are an AI that provides specific progressive overload suggestions for a single exercise.
The user will provide their past performance history.
Suggest ONE concise, actionable recommendation for today's sets. Do not write a long paragraph. 
Example output: "Aim for 62.5kg for 8 reps, or do 60kg for 10 reps."`
      },
      {
        role: "user",
        content: `Exercise: ${exerciseName}\nHistory: ${JSON.stringify(history)}`
      }
    ];

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama3-8b-8192",
      temperature: 0.5,
      max_tokens: 150,
    });

    res.json({
      success: true,
      suggestion: completion.choices[0]?.message?.content || "Try increasing weight by 2.5kg or adding 1 rep."
    });

  } catch (error) {
    res.json({
      success: true,
      suggestion: "Try increasing weight by 2.5kg or adding 1 rep."
    });
  }
});

module.exports = router;
