const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  getStats,
  getPatientStats,
  getLeaderboard,
  claimChallenge,
} = require("../controllers/gamification.controller");

// @route   GET /api/gamification/stats
// @desc    Get user stats, wellness score, challenges, achievements
// @access  Private
router.get("/stats", authenticate, getStats);

// @route   GET /api/gamification/stats/:userId
// @desc    Provider views a patient's gamification stats
// @access  Private (provider/admin only)
router.get("/stats/:userId", authenticate, authorize("provider", "admin"), getPatientStats);

// @route   GET /api/gamification/leaderboard
// @desc    Get top 10 users by wellness score
// @access  Private
router.get("/leaderboard", authenticate, getLeaderboard);

// @route   POST /api/gamification/challenges/:id/claim
// @desc    Claim a completed challenge reward
// @access  Private
router.post("/challenges/:id/claim", authenticate, claimChallenge);

module.exports = router;
