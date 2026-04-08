const UserStats = require("../models/UserStats.model");
const HealthMetric = require("../models/HealthMetric.model");
const { providerHasPatient } = require("../utils/providerAccess");

// ── Achievement Definitions ──
const ACHIEVEMENT_DEFS = {
  streak_master: {
    title: "Streak Master",
    icon: "🔥",
    tiers: {
      bronze: { target: 7, description: "Maintain a 7-day streak" },
      silver: { target: 30, description: "Maintain a 30-day streak" },
      gold: { target: 100, description: "Maintain a 100-day streak" },
    },
    getStat: (stats) => stats.currentStreak,
  },
  daily_devotee: {
    title: "Daily Devotee",
    icon: "📋",
    tiers: {
      bronze: { target: 10, description: "Complete daily challenges 10 times" },
      silver: { target: 50, description: "Complete daily challenges 50 times" },
      gold: { target: 200, description: "Complete daily challenges 200 times" },
    },
    getStat: (stats) => stats.stats.dailyChallengesCompleted,
  },
  vital_signs_pro: {
    title: "Vital Signs Pro",
    icon: "📊",
    tiers: {
      bronze: { target: 50, description: "Log 50 health metrics" },
      silver: { target: 200, description: "Log 200 health metrics" },
      gold: { target: 1000, description: "Log 1000 health metrics" },
    },
    getStat: (stats) => stats.stats.totalMetricsLogged,
  },
  med_adherent: {
    title: "Med Adherent",
    icon: "💊",
    tiers: {
      bronze: { target: 30, description: "Take medications 30 times" },
      silver: { target: 100, description: "Take medications 100 times" },
      gold: { target: 500, description: "Take medications 500 times" },
    },
    getStat: (stats) => stats.stats.totalMedsTaken,
  },
  conversation_starter: {
    title: "Conversation Starter",
    icon: "💬",
    tiers: {
      bronze: { target: 10, description: "Send 10 messages" },
      silver: { target: 50, description: "Send 50 messages" },
      gold: { target: 200, description: "Send 200 messages" },
    },
    getStat: (stats) => stats.stats.totalMessagesSent,
  },
  appointment_keeper: {
    title: "Appointment Keeper",
    icon: "📅",
    tiers: {
      bronze: { target: 5, description: "Attend 5 appointments" },
      silver: { target: 20, description: "Attend 20 appointments" },
      gold: { target: 50, description: "Attend 50 appointments" },
    },
    getStat: (stats) => stats.stats.totalAppointmentsAttended,
  },
  level_up: {
    title: "Level Up",
    icon: "⬆️",
    tiers: {
      bronze: { target: 5, description: "Reach level 5" },
      silver: { target: 15, description: "Reach level 15" },
      gold: { target: 30, description: "Reach level 30" },
    },
    getStat: (stats) => stats.level,
  },
};

// ── Daily Challenge Pool ──
const DAILY_CHALLENGE_POOL = [
  { id: "log_blood_pressure", title: "Log your blood pressure", action: "log_metric", xpReward: 25 },
  { id: "take_medications", title: "Take your medications", action: "take_medication", xpReward: 30 },
  { id: "log_weight", title: "Log your weight", action: "log_metric", xpReward: 20 },
  { id: "check_heart_rate", title: "Check your heart rate", action: "log_metric", xpReward: 20 },
  { id: "log_steps", title: "Log 5,000 steps", action: "log_metric", xpReward: 40 },
  { id: "log_sleep", title: "Log your sleep hours", action: "log_metric", xpReward: 25 },
  { id: "record_water", title: "Record your water intake", action: "log_metric", xpReward: 20 },
  { id: "log_glucose", title: "Log your blood glucose", action: "log_metric", xpReward: 25 },
  { id: "log_oxygen", title: "Check your oxygen levels", action: "log_metric", xpReward: 20 },
];

// ── Weekly Challenge Pool ──
const WEEKLY_CHALLENGE_POOL = [
  { id: "log_metrics_5d", title: "Log metrics 5 out of 7 days", xpReward: 150, target: 5 },
  { id: "complete_dailies_3x", title: "Complete all daily challenges 3 times", xpReward: 200, target: 3 },
  { id: "maintain_7d_streak", title: "Maintain a 7-day streak", xpReward: 100, target: 7 },
  { id: "take_meds_5d", title: "Take all medications for 5 days", xpReward: 150, target: 5 },
  { id: "log_metrics_daily", title: "Log a health metric every day this week", xpReward: 120, target: 7 },
];

// ── Helper: Calculate level from XP ──
const calculateLevel = (xp) => {
  let level = 1;
  let xpNeeded = 0;
  while (level < 50) {
    xpNeeded += level * 100 * 1.5;
    if (xp < xpNeeded) break;
    level++;
  }
  return level;
};

// ── Helper: XP needed for next level ──
const xpForNextLevel = (currentLevel) => {
  let total = 0;
  for (let i = 1; i <= currentLevel; i++) {
    total += i * 100 * 1.5;
  }
  return total;
};

// ── Helper: Get or create stats ──
const getOrCreateStats = async (userId) => {
  let stats = await UserStats.findOne({ userId });
  if (!stats) {
    stats = await UserStats.create({ userId });
  }
  normalizeAchievements(stats);
  return stats;
};

const normalizeAchievements = (stats) => {
  const currentAchievements = Array.isArray(stats?.achievements)
    ? stats.achievements
    : [];

  const originalSnapshot = JSON.stringify(currentAchievements);
  const byKey = new Map();

  for (const achievement of currentAchievements) {
    if (!achievement?.type || !achievement?.tier) continue;

    const def = ACHIEVEMENT_DEFS[achievement.type];
    const tierDef = def?.tiers?.[achievement.tier];
    const key = `${achievement.type}_${achievement.tier}`;
    const currentStat = def?.getStat ? def.getStat(stats) : 0;
    const normalized = {
      type: achievement.type,
      tier: achievement.tier,
      title: achievement.title || def?.title || achievement.type,
      description:
        achievement.description || tierDef?.description || "Achievement unlocked",
      icon: achievement.icon || def?.icon || "",
      unlockedAt: achievement.unlockedAt || stats.updatedAt || new Date(),
      progress: {
        current: Math.max(achievement.progress?.current ?? 0, currentStat ?? 0),
        target: achievement.progress?.target ?? tierDef?.target ?? 0,
      },
    };

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, normalized);
      continue;
    }

    const normalizedUnlockedAt = new Date(normalized.unlockedAt).getTime() || 0;
    const existingUnlockedAt = new Date(existing.unlockedAt).getTime() || 0;
    const shouldReplace =
      normalized.progress.current > existing.progress.current ||
      normalizedUnlockedAt > existingUnlockedAt;

    byKey.set(
      key,
      shouldReplace
        ? {
            ...existing,
            ...normalized,
            progress: {
              current: Math.max(
                existing.progress?.current ?? 0,
                normalized.progress?.current ?? 0,
              ),
              target: Math.max(
                existing.progress?.target ?? 0,
                normalized.progress?.target ?? 0,
              ),
            },
          }
        : {
            ...normalized,
            ...existing,
            progress: {
              current: Math.max(
                existing.progress?.current ?? 0,
                normalized.progress?.current ?? 0,
              ),
              target: Math.max(
                existing.progress?.target ?? 0,
                normalized.progress?.target ?? 0,
              ),
            },
          },
    );
  }

  const nextAchievements = Array.from(byKey.values()).sort((a, b) => {
    const aTime = new Date(a.unlockedAt).getTime() || 0;
    const bTime = new Date(b.unlockedAt).getTime() || 0;
    return aTime - bTime;
  });

  const normalizedSnapshot = JSON.stringify(nextAchievements);
  if (originalSnapshot === normalizedSnapshot) return false;

  stats.achievements = nextAchievements;
  return true;
};

// ── Helper: Check if date is today ──
const isToday = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
};

// ── Helper: Check if date is this week ──
const isThisWeek = (date) => {
  if (!date) return false;
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return new Date(date) >= weekStart;
};

/**
 * Refresh daily challenges if stale
 */
const refreshDailyChallenges = (stats) => {
  const hasToday = stats.dailyChallenges.length > 0 &&
    isToday(stats.dailyChallenges[0].generatedAt);

  if (hasToday) return false;

  // Pick 3 random unique challenges
  const shuffled = [...DAILY_CHALLENGE_POOL].sort(() => Math.random() - 0.5);
  stats.dailyChallenges = shuffled.slice(0, 3).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.title,
    xpReward: c.xpReward,
    action: c.action,
    completed: false,
    claimed: false,
    generatedAt: new Date(),
  }));
  return true;
};

/**
 * Refresh weekly challenges if stale
 */
const refreshWeeklyChallenges = (stats) => {
  const hasThisWeek = stats.weeklyChallenges.length > 0 &&
    isThisWeek(stats.weeklyChallenges[0].generatedAt);

  if (hasThisWeek) return false;

  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
  weekEnd.setHours(23, 59, 59, 999);

  const shuffled = [...WEEKLY_CHALLENGE_POOL].sort(() => Math.random() - 0.5);
  stats.weeklyChallenges = shuffled.slice(0, 2).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.title,
    xpReward: c.xpReward,
    progress: { current: 0, target: c.target },
    completed: false,
    claimed: false,
    generatedAt: new Date(),
    expiresAt: weekEnd,
  }));
  return true;
};

/**
 * Calculate wellness score based on last 7 days of activity
 */
const calculateWellnessScore = async (userId) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Domain: Vitals logging (weight 0.50)
  const metricsCount = await HealthMetric.countDocuments({
    userId,
    timestamp: { $gte: sevenDaysAgo },
  });
  const vitalsScore = Math.min(100, (metricsCount / 14) * 100); // ~2 metrics/day = 100

  const stats = await UserStats.findOne({ userId });
  if (!stats) return 0;

  // Domain: Medication adherence (weight 0.30)
  const medScore = stats.stats.totalMedsTaken > 0 ? Math.min(100, (stats.stats.totalMedsTaken / 7) * 100) : 0;

  // Domain: Activity / streak (weight 0.20) — based on streak
  const activityScore = stats.currentStreak > 0 ? Math.min(100, (stats.currentStreak / 7) * 100) : 0;

  const score = Math.round(
    vitalsScore * 0.50 +
    medScore * 0.30 +
    activityScore * 0.20
  );

  return Math.min(100, score);
};

/**
 * Update streak logic
 */
const updateStreak = (stats) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (stats.lastActivityDate) {
    const lastActivity = new Date(stats.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day
      stats.currentStreak += 1;
      stats.streakFrozen = false;
    } else if (daysDiff === 2) {
      // 1 missed day — freeze (forgiving)
      stats.streakFrozen = true;
    } else {
      // 2+ missed days — reset
      stats.currentStreak = 1;
      stats.streakFrozen = false;
    }
  } else {
    stats.currentStreak = 1;
  }

  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak;
  }

  stats.lastActivityDate = new Date();
};

/**
 * Check all achievements and unlock newly qualified ones
 */
const checkAchievements = (stats) => {
  const newlyUnlocked = [];

  for (const [type, def] of Object.entries(ACHIEVEMENT_DEFS)) {
    const currentValue = def.getStat(stats);

    for (const [tier, tierDef] of Object.entries(def.tiers)) {
      const alreadyHas = stats.achievements.some(
        (a) => a.type === type && a.tier === tier,
      );

      if (!alreadyHas && currentValue >= tierDef.target) {
        const achievement = {
          type,
          tier,
          title: def.title,
          description: tierDef.description,
          icon: def.icon,
          unlockedAt: new Date(),
          progress: { current: currentValue, target: tierDef.target },
        };
        stats.achievements.push(achievement);
        newlyUnlocked.push(achievement);
      }
    }
  }

  return newlyUnlocked;
};

/**
 * Award XP — called by other controllers on user actions
 */
const awardXP = async (userId, action, metadata = {}) => {
  try {
    const stats = await getOrCreateStats(userId);

    // Reset daily XP counter if new day
    if (!isToday(stats.xpLastResetDate)) {
      stats.xpActionsToday = 0;
      stats.xpLastResetDate = new Date();
    }

    // Diminishing returns: 1st=50, 2nd=30, 3rd=20, 4th+=10
    const xpTiers = [50, 30, 20];
    const xpGained = stats.xpActionsToday < 3
      ? xpTiers[stats.xpActionsToday]
      : 10;

    stats.xp += xpGained;
    stats.xpActionsToday += 1;

    // Recalculate level
    stats.level = calculateLevel(stats.xp);

    // Update streak
    updateStreak(stats);

    // Increment relevant stat counters
    const statMap = {
      log_metric: "totalMetricsLogged",
      log_meal: "totalMealsLogged",
      take_medication: "totalMedsTaken",
      write_journal: "totalJournalEntries",
      send_message: "totalMessagesSent",
      attend_appointment: "totalAppointmentsAttended",
    };

    if (statMap[action]) {
      stats.stats[statMap[action]] += 1;
    }

    stats.stats.daysActive = Math.max(
      stats.stats.daysActive,
      stats.currentStreak,
    );

    // Check daily challenge completion
    refreshDailyChallenges(stats);
    for (const challenge of stats.dailyChallenges) {
      if (!challenge.completed && challenge.action === action) {
        challenge.completed = true;
        stats.stats.dailyChallengesCompleted += 1;
        break;
      }
    }

    // Check achievements
    const newAchievements = checkAchievements(stats);

    await stats.save();

    return { xpGained, newLevel: stats.level, streak: stats.currentStreak, newAchievements };
  } catch (error) {
    console.error("Error awarding XP:", error);
  }
};

/**
 * GET /api/gamification/stats — Full dashboard data
 */
const getStats = async (req, res) => {
  try {
    const stats = await getOrCreateStats(req.user._id);

    // Refresh challenges if stale
    const dailyRefreshed = refreshDailyChallenges(stats);
    const weeklyRefreshed = refreshWeeklyChallenges(stats);
    const achievementsNormalized = normalizeAchievements(stats);

    // Recalculate wellness score
    stats.wellnessScore = await calculateWellnessScore(req.user._id);

    if (dailyRefreshed || weeklyRefreshed || achievementsNormalized || true) {
      await stats.save();
    }

    // Compute XP progress for current level
    const currentLevelXP = stats.level > 1 ? xpForNextLevel(stats.level - 1) : 0;
    const nextLevelXP = xpForNextLevel(stats.level);
    const xpProgress = {
      current: stats.xp - currentLevelXP,
      needed: nextLevelXP - currentLevelXP,
      percentage: Math.round(((stats.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100),
    };

    res.json({
      success: true,
      data: {
        wellnessScore: stats.wellnessScore,
        xp: stats.xp,
        level: stats.level,
        xpProgress,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        streakFrozen: stats.streakFrozen,
        dailyChallenges: stats.dailyChallenges,
        weeklyChallenges: stats.weeklyChallenges,
        achievements: stats.achievements,
        stats: stats.stats,
      },
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user statistics",
    });
  }
};

/**
 * GET /api/gamification/leaderboard — Top 10 by wellness score
 */
const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await UserStats.find()
      .sort({ wellnessScore: -1 })
      .limit(10)
      .populate("userId", "profile.firstName profile.lastName")
      .select("userId wellnessScore level currentStreak");

    const data = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId?._id,
      name: entry.userId
        ? `${entry.userId.profile?.firstName || "User"} ${(entry.userId.profile?.lastName || "")[0] || ""}.`
        : "Unknown",
      wellnessScore: entry.wellnessScore,
      level: entry.level,
      streak: entry.currentStreak,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve leaderboard",
    });
  }
};

/**
 * POST /api/gamification/challenges/:id/claim — Claim challenge reward
 */
const claimChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await getOrCreateStats(req.user._id);

    // Check daily challenges
    let challenge = stats.dailyChallenges.find((c) => c.id === id);
    let isWeekly = false;

    if (!challenge) {
      challenge = stats.weeklyChallenges.find((c) => c.id === id);
      isWeekly = true;
    }

    if (!challenge) {
      return res.status(404).json({ success: false, message: "Challenge not found" });
    }

    if (!challenge.completed) {
      return res.status(400).json({ success: false, message: "Challenge not yet completed" });
    }

    if (challenge.claimed) {
      return res.status(400).json({ success: false, message: "Challenge already claimed" });
    }

    challenge.claimed = true;
    stats.xp += challenge.xpReward;
    stats.level = calculateLevel(stats.xp);

    checkAchievements(stats);
    await stats.save();

    res.json({
      success: true,
      data: { xpAwarded: challenge.xpReward, newXP: stats.xp, newLevel: stats.level },
    });
  } catch (error) {
    console.error("Error claiming challenge:", error);
    res.status(500).json({ success: false, message: "Failed to claim challenge" });
  }
};

/**
 * GET /api/gamification/stats/:userId — Provider views a patient's gamification stats
 */
const getPatientStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role === "provider") {
      const allowed = await providerHasPatient(req.user._id, userId);
      if (!allowed) return res.status(403).json({ success: false, message: "Access denied" });
    }

    const stats = await UserStats.findOne({ userId });
    if (!stats) {
      return res.json({
        success: true,
        data: {
          wellnessScore: 0,
          xp: 0,
          level: 1,
          xpProgress: { current: 0, needed: 100, percentage: 0 },
          currentStreak: 0,
          longestStreak: 0,
          streakFrozen: false,
          achievements: [],
          stats: {},
        },
      });
    }

    if (normalizeAchievements(stats)) {
      await stats.save();
    }

    const currentLevelXP = stats.level > 1 ? xpForNextLevel(stats.level - 1) : 0;
    const nextLevelXP = xpForNextLevel(stats.level);
    const xpProgress = {
      current: stats.xp - currentLevelXP,
      needed: nextLevelXP - currentLevelXP,
      percentage: Math.round(((stats.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100),
    };

    res.json({
      success: true,
      data: {
        wellnessScore: stats.wellnessScore,
        xp: stats.xp,
        level: stats.level,
        xpProgress,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        streakFrozen: stats.streakFrozen,
        achievements: stats.achievements,
        stats: stats.stats,
      },
    });
  } catch (error) {
    console.error("Error getting patient stats:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve patient statistics" });
  }
};

module.exports = {
  getStats,
  getPatientStats,
  awardXP,
  getLeaderboard,
  claimChallenge,
};
