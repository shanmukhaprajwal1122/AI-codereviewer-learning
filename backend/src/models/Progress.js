const mongoose = require("mongoose");

const completedChallengeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  difficulty: { type: String, default: "medium" },
  language: { type: String, default: "python" },
  completedAt: { type: Date, default: Date.now }
}, { _id: false });

const progressSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  xp: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  completedChallengeIds: { type: [String], default: [] },
  completedChallenges: { type: [completedChallengeSchema], default: [] },
});

module.exports = mongoose.model("Progress", progressSchema);
