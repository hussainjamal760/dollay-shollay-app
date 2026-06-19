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
      model: "llama-3.1-8b-instant",
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
      model: "llama-3.1-8b-instant",
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

router.post('/generate-plan', async (req, res) => {
  try {
    const { daysPerWeek, userDetails } = req.body;
    
    const messages = [
      {
        role: "system",
        content: `You are an expert AI personal trainer. Create a workout plan in strictly valid JSON format.
The JSON must exactly match this structure:
{
  "name": "AI Generated Plan",
  "days": [
    {
      "dayOfWeek": "Day 1",
      "exercises": [
        {
          "muscle": "Chest",
          "name": "Bench Press",
          "sets": 3,
          "reps": 10,
          "weightLifted": 20
        }
      ]
    }
  ]
}
Generate exactly ${daysPerWeek} workout days in the "days" array.`
      },
      {
        role: "user",
        content: `Create a ${daysPerWeek}-day workout plan. My details: ${JSON.stringify(userDetails)}`
      }
    ];

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const plan = JSON.parse(completion.choices[0]?.message?.content || "{}");
    
    res.json({
      success: true,
      plan
    });

  } catch (error) {
    console.error('AI Generate Plan error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate plan.' });
  }
});

router.post('/analyze-day', async (req, res) => {
  try {
    const { dayOfWeek, exercises } = req.body;

    const messages = [
      {
        role: "system",
        content: `You are an expert master fitness coach. The user will provide a list of exercises they plan to do on a specific day.
Your task:
1. Rate the routine out of 10 for effectiveness (hypertrophy/strength).
2. Provide 2-3 concise, actionable suggestions to improve it (e.g., exercise order, missing muscle groups, volume adjustments).
Do not write a long essay. Keep it punchy and encouraging.`
      },
      {
        role: "user",
        content: `Day: ${dayOfWeek}\nExercises: ${JSON.stringify(exercises)}`
      }
    ];

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.6,
      max_tokens: 300,
    });

    res.json({
      success: true,
      analysis: completion.choices[0]?.message?.content || "Looks like a solid routine, keep pushing!"
    });
  } catch (error) {
    console.error('AI Analyze Day error:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze day.' });
  }
});

router.post('/analyze-food', async (req, res) => {
  try {
    const { foodText } = req.body;

    const messages = [
      {
        role: "system",
        content: `You are an expert nutritionist. The user will provide a text describing what they ate (in English or Urdu/Roman Urdu).
Analyze the food and estimate the macronutrients.
Return the result strictly in this JSON format:
{
  "protein": 25,
  "carbs": 30,
  "fat": 10,
  "calories": 310
}
Use reasonable estimates. Only return valid JSON, no other text.`
      },
      {
        role: "user",
        content: foodText
      }
    ];

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 150,
      response_format: { type: "json_object" }
    });

    const macros = JSON.parse(completion.choices[0]?.message?.content || "{}");
    
    res.json({
      success: true,
      macros: {
        protein: macros.protein || 0,
        carbs: macros.carbs || 0,
        fat: macros.fat || 0,
        calories: macros.calories || 0
      }
    });

  } catch (error) {
    console.error('AI Analyze Food error:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze food.' });
  }
});

module.exports = router;
