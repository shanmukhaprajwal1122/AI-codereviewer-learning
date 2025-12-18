const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const User = require('../models/User');

// Helper to get username from session or JWT
async function getUsername(req) {
  if (req.session?.user?.username) return req.session.user.username;
  if (req.user?.username) return req.user.username;
  return 'Anonymous';
}

// activity.routes.js - replace POST /log handler with this
router.post('/log', async (req, res) => {
  const { action, details = {}, requestId } = req.body;

  try {
    const username = await getUsername(req);

    // normalize action
    let mappedAction = action;
    if (action === 'code_review_requested' || action === 'code_review_started') mappedAction = 'code_review';
    if (action === 'code_review_completed') mappedAction = 'code_review';
    if (!['code_review', 'quiz_session', 'file_upload', 'general'].includes(mappedAction)) mappedAction = 'general';

    // extract targetId from details.metadata.* or details.targetId
    const targetId =
      details?.metadata?.targetId ||
      details?.metadata?.reviewId ||
      details?.metadata?.submissionId ||
      details?.targetId ||
      undefined;

    // debug log (optional — keep or remove)
    console.log('[Activity] incoming', { username, action, requestId, targetId, time: new Date().toISOString() });

    // 1) If requestId provided and there's already a doc -> return it (idempotency)
    if (requestId) {
      const existingByReq = await Activity.findOne({ requestId });
      if (existingByReq) {
        return res.status(200).json({ message: 'Duplicate request ignored (requestId)', activity: existingByReq });
      }
    }

    // ---- CODE REVIEW COMPLETION: update existing in-progress doc (prefer) ----
    if (action === 'code_review_completed') {
      const findQuery = {
        username,
        action: 'code_review',
        status: { $in: ['in_progress', 'pending'] }
      };
      if (targetId) findQuery['details.metadata.targetId'] = targetId;

      const existing = await Activity.findOne(findQuery).sort({ createdAt: -1 });

      if (existing) {
        // update fields
        existing.codeReview = existing.codeReview || {};
        existing.codeReview.requested = existing.codeReview.requested || true;
        existing.codeReview.completed = true;
        existing.codeReview.completedAt = new Date();

        if (Array.isArray(details?.fileNames) && details.fileNames.length) {
          existing.codeReview.fileNames = [...new Set([...(existing.codeReview.fileNames || []), ...details.fileNames])];
        }
        if (details?.language) existing.codeReview.language = details.language;
        if (typeof details?.codeLength === 'number') existing.codeReview.codeLength = details.codeLength;
        if (details?.reviewSummary) existing.codeReview.reviewSummary = details.reviewSummary;
        if (typeof details?.issuesFound === 'number') existing.codeReview.issuesFound = details.issuesFound;

        existing.details = { ...(existing.details || {}), ...details };
        existing.status = 'completed';
        if (requestId) existing.requestId = requestId;

        await existing.save();
        return res.status(200).json({ message: 'Code review updated to completed', activity: existing });
      }

      // fallback: create a single completed doc (no preexisting)
      const fallback = new Activity({
        username,
        action: 'code_review',
        details,
        requestId: requestId || undefined,
        codeReview: {
          requested: true,
          completed: true,
          completedAt: new Date(),
          fileNames: Array.isArray(details?.fileNames) ? details.fileNames : []
        },
        status: 'completed'
      });

      try {
        await fallback.save();
        return res.status(201).json({ message: 'Code review completed (created)', activity: fallback });
      } catch (err) {
        // If unique index prevents creation (race), return the existing doc instead
        if (err && err.code === 11000) {
          const existingRace = await Activity.findOne({
            username,
            action: 'code_review',
            'details.metadata.targetId': targetId
          }).sort({ createdAt: -1 });
          if (existingRace) return res.status(200).json({ message: 'Duplicate avoided (race)', activity: existingRace });
        }
        throw err;
      }
    }

    // ---- CODE REVIEW REQUESTED: create OR return existing (avoid duplicates) ----
    if (action === 'code_review_requested') {
      if (targetId) {
        const existing = await Activity.findOne({
          username,
          action: 'code_review',
          'details.metadata.targetId': targetId
        });
        if (existing) {
          // if existing is already in_progress or completed, return it (no new doc)
          return res.status(200).json({ message: 'Request already logged', activity: existing });
        }
      } else {
        // If no targetId provided, check very recent one to avoid accidental double-click duplicates
        const RECENT_MS = 5000;
        const recentCutoff = new Date(Date.now() - RECENT_MS);
        const recent = await Activity.findOne({ username, action: 'code_review', createdAt: { $gte: recentCutoff } });
        if (recent) return res.status(200).json({ message: 'Duplicate request ignored (recent)', activity: recent });
      }

      // create new in-progress activity
      const newAct = new Activity({
        username,
        action: 'code_review',
        details,
        requestId: requestId || undefined,
        codeReview: {
          requested: true,
          requestedAt: new Date(),
          completed: false,
          fileNames: Array.isArray(details?.fileNames) ? details.fileNames : []
        },
        status: 'in_progress'
      });

      try {
        await newAct.save();
        return res.status(201).json({ message: 'Code review requested', activity: newAct });
      } catch (err) {
        // If unique index causes duplicate error (race), return the existing document instead
        if (err && err.code === 11000) {
          const existingRace = await Activity.findOne({
            username,
            action: 'code_review',
            'details.metadata.targetId': targetId
          }).sort({ createdAt: -1 });
          if (existingRace) return res.status(200).json({ message: 'Duplicate avoided (race)', activity: existingRace });
        }
        throw err;
      }
    }

    // ---- DEFAULT: general actions (guard small rapid duplicates) ----
    const RECENT_GENERAL_MS = 3000;
    const recentCutoff = new Date(Date.now() - RECENT_GENERAL_MS);
    const recentGeneral = await Activity.findOne({
      username,
      action: mappedAction,
      createdAt: { $gte: recentCutoff }
    });
    if (recentGeneral) {
      return res.status(200).json({ message: 'Duplicate ignored (recent-general)', activity: recentGeneral });
    }

    // create general activity
    const newActivity = new Activity({
      username,
      action: mappedAction,
      details,
      requestId: requestId || undefined,
      status: 'completed'
    });

    await newActivity.save();
    return res.status(201).json({ message: 'Activity logged', activity: newActivity });
  } catch (err) {
    // handle duplicate-key race on requestId / unique_user_action_target
    if (err && err.code === 11000) {
      // prefer to return existing doc matching username+action+targetId if possible
      try {
        const existing = await Activity.findOne({
          username: req.session?.user?.username || undefined,
          action: action === 'code_review_completed' ? 'code_review' : action,
          'details.metadata.targetId': details?.metadata?.targetId
        }).sort({ createdAt: -1 });
        if (existing) return res.status(200).json({ message: 'Duplicate request ignored (db 11000)', activity: existing });
      } catch (e) { /* ignore and fallthrough */ }
    }
    console.error('❌ Activity log failed:', err);
    return res.status(500).json({ message: 'Failed to log activity', error: String(err) });
  }
});


router.get('/history', async (req, res) => {
  try {
    const username = req.query.username || await getUsername(req);
    const limit = parseInt(req.query.limit) || 50;
    
    const activities = await Activity.find({ username })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    res.json({ success: true, activities });
  } catch (err) {
    console.error('Activity history error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch activity history' });
  }
});

module.exports = router;
