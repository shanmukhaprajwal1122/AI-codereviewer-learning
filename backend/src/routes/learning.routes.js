// src/routes/learning.routes.js - Complete Learning API
const express = require("express");
const router = express.Router();
const { VM } = require("vm2");

const Progress = require("../models/Progress");
const { pickRandomChallenge, findChallengeById, getAllChallengesByTopicAndDifficulty } = require("../data/challenges");

/* ------------------ Helpers ------------------ */
function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function awardXPFor(difficulty = "easy") {
  return difficulty === "hard" ? 45 : difficulty === "medium" ? 30 : 15;
}

function badgeKey(topic, difficulty) {
  return `${topic}-${difficulty}-master`;
}

/* ------------------ Routes ------------------- */

// GET /api/learning/challenge - Get a random challenge (excluding completed ones)
// Query params: topic, difficulty, username
router.get("/api/learning/challenge", async (req, res) => {
  try {
    const { topic, difficulty, username } = req.query;
    
    if (!username) {
      return res.status(400).json({ success: false, message: "Username required" });
    }

    // Get user progress to exclude completed challenges
    let progress = await Progress.findOne({ username });
    const completedIds = progress ? progress.completedChallengeIds : [];

    // Pick a random challenge excluding completed ones
    const ch = pickRandomChallenge({ 
      topic, 
      difficulty, 
      excludeIds: completedIds 
    });

    if (!ch) {
      return res.status(404).json({ 
        success: false, 
        message: "No more challenges available for this topic/difficulty. Try a different one!" 
      });
    }

    // Don't send the expected answers to the client
    const maskedCases = ch.cases.map((c, idx) => ({ 
      idx, 
      args: c.args 
    }));

    return res.json({
      success: true,
      challenge: {
        id: ch.id,
        topic: ch.topic,
        difficulty: ch.difficulty,
        title: ch.title,
        prompt: ch.prompt,
        functionName: ch.functionName,
        signature: ch.signature,
        starterCode: ch.starterCode,
        tests: maskedCases,
      },
    });
  } catch (err) {
    console.error("❌ /api/learning/challenge:", err);
    res.status(500).json({ success: false, message: "Failed to fetch challenge" });
  }
});
// POST /api/learning/run-tests - Run tests for a challenge
router.post("/api/learning/run-tests", async (req, res) => {
  try {
    const { challengeId, code, username } = req.body || {};

    if (!challengeId || typeof code !== "string" || !username) {
      return res.status(400).json({
        success: false,
        message: "challengeId, username, and code are required",
      });
    }

    const ch = findChallengeById(challengeId);
    if (!ch) {
      return res.status(404).json({ success: false, message: "Challenge not found" });
    }

    const vm = new VM({
      timeout: 1500,
      sandbox: {},
    });

    let results = [];
    let allPassed = true;

    for (const [i, test] of ch.cases.entries()) {
      try {
        // combine user code + return of function
        const fullCode = `
          ${code};
          module.exports = ${ch.functionName}(${test.args.map((a) => JSON.stringify(a)).join(",")});
        `;
        const output = vm.run(fullCode);
        const passed = deepEqual(output, test.expected);
        results.push({
          case: i + 1,
          args: test.args,
          expected: test.expected,
          output,
          passed,
        });
        if (!passed) allPassed = false;
      } catch (err) {
        allPassed = false;
        results.push({
          case: i + 1,
          args: test.args,
          expected: test.expected,
          output: `Error: ${err.message}`,
          passed: false,
        });
      }
    }

    // If user passed all tests, update progress
    let xpGained = 0;
    let badge = null;
    if (allPassed) {
      xpGained = awardXPFor(ch.difficulty);
      let progress = await Progress.findOne({ username });

      if (!progress) {
        progress = new Progress({
          username,
          xp: 0,
          badges: [],
          completedChallengeIds: [],
        });
      }

        // Add challenge ID if not already completed
        if (!progress.completedChallengeIds.includes(challengeId)) {
          progress.completedChallengeIds.push(challengeId);
          progress.completedChallenges.push({
            id: challengeId,
            title: ch.title,
            difficulty: ch.difficulty,
            language: "javascript",
            completedAt: new Date()
          });
          progress.xp += xpGained;
        }

      // Award badge if topic/difficulty fully mastered
      const allTopicChallenges = getAllChallengesByTopicAndDifficulty(ch.topic, ch.difficulty);
      const completedInTopic = progress.completedChallengeIds.filter((id) =>
        allTopicChallenges.some((c) => c.id === id)
      );

      if (
        completedInTopic.length === allTopicChallenges.length &&
        !progress.badges.includes(badgeKey(ch.topic, ch.difficulty))
      ) {
        badge = badgeKey(ch.topic, ch.difficulty);
        progress.badges.push(badge);
      }

      await progress.save();

      // Log activity
      try {
        const Activity = require("../models/Activity");
        const activity = new Activity({
          username,
          action: "challenge_completed",
          details: {
            description: `Completed challenge: ${ch.title}`,
            metadata: {
              challengeId,
              topic: ch.topic,
              difficulty: ch.difficulty,
              xpGained
            }
          },
          status: "completed"
        });
        await activity.save();
      } catch (activityErr) {
        console.error("Failed to log challenge activity:", activityErr);
      }
    }

    return res.json({
      success: true,
      allPassed,
      xpGained,
      badge,
      results,
    });
  } catch (err) {
    console.error("❌ /api/learning/run-tests:", err);
    res.status(500).json({ success: false, message: "Failed to run tests" });
  }
});

// Export router
module.exports = router;
