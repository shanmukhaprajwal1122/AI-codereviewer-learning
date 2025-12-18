// models/Activity.js
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: ['code_review', 'quiz_session', 'file_upload', 'challenge_completed', 'general']
  },

  // optional idempotency key
  requestId: { type: String, index: true },

  // Code Review specific fields
  codeReview: {
    requested: { type: Boolean, default: false },
    requestedAt: Date,
    completed: { type: Boolean, default: false },
    completedAt: Date,
    fileNames: [String],
    language: String,
    codeLength: Number,
    reviewSummary: String,
    issuesFound: Number
  },

  // General details
  details: {
    description: String,
    xp: Number,
    metadata: mongoose.Schema.Types.Mixed
  },

  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  collection: 'activities',
  timestamps: true
});

// Helpful non-unique index
activitySchema.index({ username: 1, action: 1, status: 1 });

// Unique idempotency index (applies only when requestId set)
activitySchema.index({ requestId: 1 }, { unique: true, sparse: true });

// IMPORTANT: unique index that prevents more than one activity with same username+action+targetId
// This ensures if both request and completion use same details.metadata.targetId, only one document exists.
activitySchema.index(
  { username: 1, action: 1, 'details.metadata.targetId': 1 },
  { unique: true, sparse: true, name: 'unique_user_action_target' }
);

module.exports = mongoose.model('Activity', activitySchema);
