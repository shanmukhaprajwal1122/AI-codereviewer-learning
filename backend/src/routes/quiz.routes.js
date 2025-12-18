// src/routes/quiz.routes.js
const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const Activity = require("../models/Activity");
const Progress = require("../models/Progress");

// Use a dedicated key for the single-question quiz API
// Add GROQ_SINGLE_QUIZ_API_KEY=gsk_... in your .env
const SINGLE_KEY = process.env.GROQ_SINGLE_QUIZ_API_KEY;

if (!SINGLE_KEY) {
  console.warn("⚠️  GROQ_SINGLE_QUIZ_API_KEY is not set. Add it to your .env");
}
const groq = new Groq({ apiKey: SINGLE_KEY });

// Store questions temporarily (in production, use Redis or DB)
const questionStore = new Map();

// Generate a single question
router.post("/generate", async (req, res) => {
  try {
    const { language = "python", difficulty = "easy" } = req.body || {};

    if (!SINGLE_KEY) {
      return res.status(401).json({ error: "Missing GROQ_SINGLE_QUIZ_API_KEY" });
    }

    const prompt = `Generate ONE multiple-choice programming question about ${language}.
Difficulty: ${difficulty}

Return ONLY a valid JSON object (no prose, no markdown) with exactly:
{
  "question": "Clear question text",
  "code": "code snippet here (use empty string if not needed)",
  "options": ["option A", "option B", "option C", "option D"],
  "answerIndex": 0,
  "explanation": "Brief explanation of the correct answer"
}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // fast + free-tier friendly (or use llama-3.1-70b-versatile)
      messages: [
        { role: "system", content: "Return only VALID JSON. No markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 900,
    });

    let text = (completion.choices?.[0]?.message?.content || "").trim();
    // Strip any accidental code fences
    text = text
      .replace(/^\s*```json\s*/i, "")
      .replace(/^\s*```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    // Parse JSON, with a fallback to the first {...} block
    let questionData;
    try {
      questionData = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error("❌ Groq returned non-JSON:", text.slice(0, 300));
        return res.status(500).json({ error: "Model returned invalid JSON. Please retry." });
      }
      questionData = JSON.parse(match[0]);
    }

    // Validate structure
    if (
      !questionData?.question ||
      !Array.isArray(questionData.options) ||
      questionData.options.length !== 4 ||
      typeof questionData.answerIndex !== "number" ||
      questionData.answerIndex < 0 ||
      questionData.answerIndex > 3
    ) {
      return res.status(500).json({ error: "Invalid question format from model" });
    }

    // Unique ID + store with answer for later verification
    const id = Date.now() + "_" + Math.random().toString(36).slice(2, 11);
    questionStore.set(id, { ...questionData, timestamp: Date.now() });

    // Clean up old entries (older than 1 hour)
    const cutoff = Date.now() - 3600_000;
    for (const [key, val] of questionStore.entries()) {
      if (val.timestamp < cutoff) questionStore.delete(key);
    }

    // Return question WITHOUT the answerIndex
    res.json({
      data: {
        id,
        question: questionData.question,
        code: questionData.code || "",
        options: questionData.options,
      },
    });
  } catch (error) {
    const status = error?.status || error?.code;
    if (status === 401 || /unauthorized|invalid.*key/i.test(error?.message || "")) {
      return res.status(401).json({ error: "Invalid or missing GROQ_SINGLE_QUIZ_API_KEY" });
    }
    console.error("❌ Error generating single question (Groq):", error);
    res.status(500).json({ error: "Failed to generate question", message: error?.message || "Unknown error" });
  }
});

// Submit answer and get feedback
router.post("/submit", async (req, res) => {
  // ... (existing code)
});

// Finalize quiz and award total XP
router.post("/finish", async (req, res) => {
  try {
    const { username = "User", score, total, language = "programming" } = req.body || {};
    
    if (typeof score !== "number" || typeof total !== "number") {
      return res.status(400).json({ error: "Invalid score data" });
    }

    // Award 2 XP per correct answer, max 20 XP
    const xpAwarded = Math.min(20, score * 2);

    if (xpAwarded > 0) {
      // Update Progress
      let progress = await Progress.findOne({ username });
      if (!progress) {
        progress = await Progress.create({ username, xp: 0, badges: [], completedChallengeIds: [] });
      }
      progress.xp = (progress.xp || 0) + xpAwarded;
      await progress.save();

      // Log Activity
      const activity = new Activity({
        username,
        action: 'quiz_session',
        details: {
          description: `Completed ${language} quiz: ${score}/${total}`,
          xp: xpAwarded,
          metadata: {
            score,
            total,
            language
          }
        },
        status: 'completed'
      });
      await activity.save();
    }

    res.json({ success: true, xpGained: xpAwarded });
  } catch (error) {
    console.error("❌ Error finishing quiz:", error);
    res.status(500).json({ error: "Failed to finish quiz" });
  }
});

module.exports = router;
