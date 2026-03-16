const mongoose = require("mongoose");

const userStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Core scores
    wellnessScore: { type: Number, default: 0, min: 0, max: 100 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },

    // Streaks
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    streakFrozen: { type: Boolean, default: false },
    lastActivityDate: Date,

    // Achievements
    achievements: [
      {
        type: { type: String },
        tier: { type: String, enum: ["bronze", "silver", "gold"] },
        title: String,
        description: String,
        icon: String,
        unlockedAt: Date,
        progress: { current: Number, target: Number },
      },
    ],

    // Daily Challenges
    dailyChallenges: [
      {
        id: String,
        title: String,
        description: String,
        xpReward: Number,
        action: String,
        completed: { type: Boolean, default: false },
        claimed: { type: Boolean, default: false },
        generatedAt: Date,
      },
    ],

    // Weekly Challenges
    weeklyChallenges: [
      {
        id: String,
        title: String,
        description: String,
        xpReward: Number,
        progress: { current: Number, target: Number },
        completed: { type: Boolean, default: false },
        claimed: { type: Boolean, default: false },
        generatedAt: Date,
        expiresAt: Date,
      },
    ],

    // Aggregate counters (for achievement checks)
    stats: {
      totalMetricsLogged: { type: Number, default: 0 },
      totalMealsLogged: { type: Number, default: 0 },
      totalMedsTaken: { type: Number, default: 0 },
      totalJournalEntries: { type: Number, default: 0 },
      totalMessagesSent: { type: Number, default: 0 },
      totalAppointmentsAttended: { type: Number, default: 0 },
      daysActive: { type: Number, default: 0 },
      dailyChallengesCompleted: { type: Number, default: 0 },
    },

    // XP diminishing returns tracking
    xpActionsToday: { type: Number, default: 0 },
    xpLastResetDate: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("UserStats", userStatsSchema);
