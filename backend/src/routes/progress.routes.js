// backend/routes/progress.routes.js
// Endpoints:
//  GET  /api/progress/:username         -> fetch progress
//  POST /api/progress/award             -> award XP + badges when a challenge is passed

const express = require("express");
const router = express.Router();
const Progress = require("../models/Progress");

// ---- XP map by difficulty
const XP_BY_DIFFICULTY = {
  easy: 10,
  medium: 20,
  hard: 30,
};

// ---- Helper: compute newly earned badges
function computeBadges({ doc, difficulty, language, justCompletedCountBefore }) {
  const newBadges = [];

  // First solve ever
  if (justCompletedCountBefore === 0) {
    newBadges.push("First Solve");
  }

  // First solve in a language
  const langBadge = `First ${String(language || "javascript").toUpperCase()} Solve`;
  if (!doc.badges.includes(langBadge)) {
    newBadges.push(langBadge);
  }

  // Difficulty badges
  if (difficulty === "hard" && !doc.badges.includes("Hard Hitter")) {
    newBadges.push("Hard Hitter");
  }

  // Milestones by total completed
  const total = (doc.completedChallengeIds || []).length + 1; // +1 after this completion
  if (total >= 5 && !doc.badges.includes("Apprentice (5)")) newBadges.push("Apprentice (5)");
  if (total >= 10 && !doc.badges.includes("Pro (10)")) newBadges.push("Pro (10)");
  if (total >= 20 && !doc.badges.includes("Master (20)")) newBadges.push("Master (20)");

  return newBadges;
}

// GET progress for a username
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) return res.status(400).json({ success: false, message: "username required" });

    let doc = await Progress.findOne({ username });
    if (!doc) {
      doc = await Progress.create({ username, xp: 0, badges: [], completedChallengeIds: [] });
    }

    res.json({ success: true, progress: doc });
  } catch (err) {
    console.error("GET /api/progress error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch progress", error: err.message });
  }
});

// Award XP/badges after a pass
router.post("/award", async (req, res) => {
  try {
    const { username, challengeId, challengeTitle, difficulty = "easy", language = "javascript", passed } = req.body || {};
    if (!username || !challengeId) {
      return res.status(400).json({ success: false, message: "username and challengeId required" });
    }
    if (!passed) {
      return res.json({ success: true, message: "No award because not passed", xpGained: 0 });
    }

    let doc = await Progress.findOne({ username });
    if (!doc) {
      doc = await Progress.create({ username, xp: 0, badges: [], completedChallengeIds: [], completedChallenges: [] });
    }

    // If already completed, don't double-count
    if (doc.completedChallengeIds.includes(challengeId)) {
      return res.json({
        success: true,
        message: "Already completed; no additional XP",
        progress: doc,
        xpGained: 0,
        badgesAwarded: [],
        alreadyCompleted: true,
      });
    }

    const justCompletedCountBefore = doc.completedChallengeIds.length;
    const xpGain = XP_BY_DIFFICULTY[difficulty] ?? XP_BY_DIFFICULTY.easy;

    // Calculate new badges
    const badgesAwarded = computeBadges({ doc, difficulty, language, justCompletedCountBefore });

    // Update doc
    doc.completedChallengeIds.push(challengeId);
    if (!doc.completedChallenges) doc.completedChallenges = [];
    doc.completedChallenges.push({
      id: challengeId,
      title: challengeTitle || challengeId,
      difficulty: difficulty,
      language: language,
      completedAt: new Date()
    });
    doc.xp = (doc.xp || 0) + xpGain;
    doc.badges = Array.from(new Set([...(doc.badges || []), ...badgesAwarded]));
    await doc.save();

    res.json({
      success: true,
      progress: doc,
      xpGained: xpGain,
      badgesAwarded,
      alreadyCompleted: false,
    });
  } catch (err) {
    console.error("POST /api/progress/award error:", err);
    res.status(500).json({ success: false, message: "Failed to award progress", error: err.message });
  }
});

module.exports = router;
