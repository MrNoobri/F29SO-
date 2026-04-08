const HealthMetric = require("../models/HealthMetric.model");
const Alert = require("../models/Alert.model");
const mongoose = require("mongoose");
const { createAuditLog } = require("../middleware/audit.middleware");
const { awardXP } = require("./gamification.controller");
const { providerHasPatient } = require("../utils/providerAccess");

/**
 * Health metric thresholds for alert generation
 */
const ALERT_THRESHOLDS = {
  heartRate: { min: 60, max: 100, unit: "bpm" },
  bloodPressure: {
    systolic: { min: 90, max: 140 },
    diastolic: { min: 60, max: 90 },
    unit: "mmHg",
  },
  bloodGlucose: { min: 70, max: 140, unit: "mg/dL" },
  oxygenSaturation: { min: 95, max: 100, unit: "%" },
  temperature: { min: 36.1, max: 37.2, unit: "°C" },
};

/**
 * Check if metric value triggers an alert
 */
const checkAlertThreshold = async (metric, req) => {
  const threshold = ALERT_THRESHOLDS[metric.metricType];
  if (!threshold) return;

  let shouldAlert = false;
  let severity = "low";
  let message = "";

  if (metric.metricType === "bloodPressure") {
    const { systolic, diastolic } = metric.value;
    if (
      systolic > threshold.systolic.max ||
      diastolic > threshold.diastolic.max
    ) {
      shouldAlert = true;
      severity = systolic > 160 || diastolic > 100 ? "critical" : "medium";
      message = `Blood pressure reading (${systolic}/${diastolic} ${threshold.unit}) is higher than normal range.`;
    } else if (
      systolic < threshold.systolic.min ||
      diastolic < threshold.diastolic.min
    ) {
      shouldAlert = true;
      severity = "medium";
      message = `Blood pressure reading (${systolic}/${diastolic} ${threshold.unit}) is lower than normal range.`;
    }
  } else {
    const value =
      typeof metric.value === "object" ? metric.value.value : metric.value;
    if (value > threshold.max) {
      shouldAlert = true;
      severity = value > threshold.max * 1.2 ? "high" : "medium";
      message = `${metric.metricType} reading (${value} ${metric.unit}) is higher than normal range.`;
    } else if (value < threshold.min) {
      shouldAlert = true;
      severity = value < threshold.min * 0.8 ? "high" : "medium";
      message = `${metric.metricType} reading (${value} ${metric.unit}) is lower than normal range.`;
    }
  }

  if (shouldAlert) {
    const alert = await Alert.create({
      userId: metric.userId,
      severity,
      type: "health-metric",
      title: `Abnormal ${metric.metricType} detected`,
      message,
      metricSnapshot: {
        metricType: metric.metricType,
        value: metric.value,
        unit: metric.unit,
        threshold,
      },
    });

    // Emit socket event for critical/high alerts so providers get real-time notification
    if ((severity === "critical" || severity === "high") && req) {
      try {
        const io = req.app.get("io");
        if (io) {
          io.emit("critical-alert", {
            alertId: alert._id,
            userId: metric.userId,
            severity,
            title: alert.title,
            message,
            metricSnapshot: alert.metricSnapshot,
            createdAt: alert.createdAt,
          });
        }
      } catch (e) {
        console.error("Failed to emit critical alert socket event:", e);
      }
    }
  }
};

/**
 * Create health metric
 */
const createMetric = async (req, res) => {
  try {
    const { metricType, value, unit, source, timestamp, notes, metadata } =
      req.body;

    // For patients, use their own userId; for providers, allow specifying userId
    const userId =
      req.user.role === "patient"
        ? req.user._id
        : req.body.userId || req.user._id;

    const metric = await HealthMetric.create({
      userId,
      metricType,
      value,
      unit,
      source: source || "manual",
      timestamp: timestamp || new Date(),
      notes,
      metadata,
    });

    // Check if alert should be triggered
    await checkAlertThreshold(metric, req);

    // Award gamification XP
    await awardXP(userId, "log_metric", { metricType });

    // Audit log
    await createAuditLog(req.user._id, req.user.role, "edit-patient-data", {
      targetId: metric._id,
      targetModel: "HealthMetric",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: "Health metric recorded successfully",
      data: metric,
    });
  } catch (error) {
    console.error("Create metric error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create health metric",
    });
  }
};

/**
 * Get user's health metrics
 */
const getMetrics = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { metricType, startDate, endDate, limit = 100 } = req.query;

    // Authorization check
    if (req.user.role === "patient" && userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (req.user.role === "provider" && userId.toString() !== req.user._id.toString()) {
      const allowed = await providerHasPatient(req.user._id, userId);
      if (!allowed) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    const query = { userId };

    if (metricType) {
      query.metricType = metricType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const metrics = await HealthMetric.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Audit log for provider viewing patient data
    if (
      req.user.role === "provider" &&
      userId.toString() !== req.user._id.toString()
    ) {
      await createAuditLog(req.user._id, req.user.role, "view-patient-data", {
        targetId: userId,
        targetModel: "User",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }

    res.json({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  } catch (error) {
    console.error("Get metrics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve health metrics",
    });
  }
};

/**
 * Get latest metrics summary
 */
const getLatestMetrics = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    // Authorization check
    if (req.user.role === "patient" && userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (req.user.role === "provider" && userId.toString() !== req.user._id.toString()) {
      const allowed = await providerHasPatient(req.user._id, userId);
      if (!allowed) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    const metricTypes = [
      "steps",
      "sleep",
      "heartRate",
      "bloodPressure",
      "bloodGlucose",
      "weight",
      "calories",
      "oxygenSaturation",
      "distance",
    ];

    const latestMetrics = {};

    for (const type of metricTypes) {
      const metric = await HealthMetric.getLatest(userId, type);
      if (metric) {
        latestMetrics[type] = metric;
      }
    }

    res.json({
      success: true,
      data: latestMetrics,
    });
  } catch (error) {
    console.error("Get latest metrics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve latest metrics",
    });
  }
};

/**
 * Get metric statistics
 */
const getMetricStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { metricType, period = "7d" } = req.query;

    if (!metricType) {
      return res.status(400).json({
        success: false,
        message: "metricType is required",
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    if (period === "7d") startDate.setDate(startDate.getDate() - 7);
    else if (period === "30d") startDate.setDate(startDate.getDate() - 30);
    else if (period === "90d") startDate.setDate(startDate.getDate() - 90);

    const metrics = await HealthMetric.getInRange(
      userId,
      metricType,
      startDate,
      endDate,
    );

    // Calculate statistics
    const values = metrics
      .map((m) => (typeof m.value === "object" ? m.value.value : m.value))
      .filter((v) => typeof v === "number");

    const stats = {
      count: values.length,
      min: values.length > 0 ? Math.min(...values) : null,
      max: values.length > 0 ? Math.max(...values) : null,
      avg:
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : null,
      latest: metrics.length > 0 ? metrics[metrics.length - 1] : null,
    };

    res.json({
      success: true,
      data: stats,
      metrics,
    });
  } catch (error) {
    console.error("Get metric stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve metric statistics",
    });
  }
};

/**
 * Delete health metric
 */
const deleteMetric = async (req, res) => {
  try {
    const { id } = req.params;

    const metric = await HealthMetric.findById(id);

    if (!metric) {
      return res.status(404).json({
        success: false,
        message: "Metric not found",
      });
    }

    // Authorization check
    if (
      req.user.role === "patient" &&
      metric.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await HealthMetric.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Health metric deleted successfully",
    });
  } catch (error) {
    console.error("Delete metric error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete health metric",
    });
  }
};

/**
 * Get aggregated daily totals for today's metrics.
 * - Summable (steps, calories, distance, sleep): SUM of all values today
 * - Averageable (heartRate, oxygenSaturation): AVG of all values today
 * - Latest-value (weight, bloodPressure, bloodGlucose): most recent reading
 */
const getDailyTotals = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    // Authorization check
    if (
      req.user.role === "patient" &&
      userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const results = {};

    // ── Summable metrics (steps, calories, distance, sleep) ──
    const summableTypes = ["steps", "calories", "distance", "sleep"];
    for (const type of summableTypes) {
      const agg = await HealthMetric.aggregate([
        {
          $match: {
            userId: userObjectId,
            metricType: type,
            timestamp: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$value" },
            count: { $sum: 1 },
          },
        },
      ]);

      if (agg.length > 0 && agg[0].total > 0) {
        const latest = await HealthMetric.getLatest(userId, type);
        results[type] = {
          value: Math.round(agg[0].total * 100) / 100,
          count: agg[0].count,
          unit: latest?.unit || "",
          timestamp: latest?.timestamp,
        };
      }
    }

    // ── Averageable metrics (heartRate, oxygenSaturation) ──
    const averageableTypes = ["heartRate", "oxygenSaturation"];
    for (const type of averageableTypes) {
      const agg = await HealthMetric.aggregate([
        {
          $match: {
            userId: userObjectId,
            metricType: type,
            timestamp: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            avg: { $avg: "$value" },
            min: { $min: "$value" },
            max: { $max: "$value" },
            count: { $sum: 1 },
          },
        },
      ]);

      if (agg.length > 0) {
        const latest = await HealthMetric.getLatest(userId, type);
        results[type] = {
          value: Math.round(agg[0].avg * 10) / 10,
          min: agg[0].min,
          max: agg[0].max,
          count: agg[0].count,
          unit: latest?.unit || "",
          timestamp: latest?.timestamp,
        };
      }
    }

    // ── Latest-value metrics (weight, bloodPressure, bloodGlucose) ──
    const latestTypes = ["weight", "bloodPressure", "bloodGlucose"];
    for (const type of latestTypes) {
      const latest = await HealthMetric.getLatest(userId, type);
      if (latest) {
        results[type] = {
          value: latest.value,
          unit: latest.unit,
          timestamp: latest.timestamp,
        };
      }
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Get daily totals error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve daily totals",
    });
  }
};

// ── AI-Powered Insights (Gemini) ───────────────────────────────────────

const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let insightsGenAI = null;
if (GEMINI_API_KEY && GEMINI_API_KEY.length > 20) {
  try {
    insightsGenAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  } catch {
    // will fall back to basic insights
  }
}

const INSIGHTS_PROMPT = `You are MEDXI, a friendly AI health companion. Analyze the user's health data and return EXACTLY 3 insights as a JSON array.
Each object: {"label":"short title","icon":"heart|steps|sleep|calories|spo2|bp|glucose|weight|temp|water|exercise|general","severity":"success|warning|critical","message":"1-2 sentences with actual numbers/trends","suggestion":"1-2 actionable sentences"}
Rules: reference real numbers, flag abnormals without alarm, include something positive, be conversational and fun, return ONLY the JSON array.`;

// Per-user cache: { insights, timestamp }
const insightsCache = new Map();
const INSIGHTS_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

const generateAIInsights = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Check cache — return cached result if within cooldown
    const cached = insightsCache.get(userId);
    if (cached && Date.now() - cached.timestamp < INSIGHTS_COOLDOWN_MS) {
      return res.json({
        success: true,
        data: cached.insights,
        source: cached.source,
        cached: true,
        nextRefreshAt: new Date(
          cached.timestamp + INSIGHTS_COOLDOWN_MS,
        ).toISOString(),
      });
    }

    // Gather last 7 days + previous 7 days for all metric types
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(weekAgo);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);

    const metricTypes = [
      "heartRate", "steps", "sleep", "bloodPressure", "calories",
      "oxygenSaturation", "bloodGlucose", "weight", "temperature",
      "waterIntake", "exercise", "distance",
    ];

    const dataSummary = {};

    for (const type of metricTypes) {
      const [currentMetrics, prevMetrics] = await Promise.all([
        HealthMetric.find({
          userId,
          metricType: type,
          timestamp: { $gte: weekAgo, $lte: now },
        }).sort({ timestamp: -1 }),
        HealthMetric.find({
          userId,
          metricType: type,
          timestamp: { $gte: twoWeeksAgo, $lte: weekAgo },
        }).sort({ timestamp: -1 }),
      ]);

      if (currentMetrics.length === 0) continue;

      const extractVal = (m) =>
        typeof m.value === "object"
          ? m.value.systolic ?? m.value.value
          : Number(m.value);

      const currentVals = currentMetrics.map(extractVal).filter((v) => !isNaN(v));
      const prevVals = prevMetrics.map(extractVal).filter((v) => !isNaN(v));

      const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

      dataSummary[type] = {
        currentWeek: {
          avg: Math.round(avg(currentVals) * 10) / 10,
          min: Math.round(Math.min(...currentVals) * 10) / 10,
          max: Math.round(Math.max(...currentVals) * 10) / 10,
          count: currentVals.length,
          latest: Math.round(currentVals[0] * 10) / 10,
        },
        unit: currentMetrics[0]?.unit || "",
      };

      if (prevVals.length > 0) {
        const prevAvg = avg(prevVals);
        const curAvg = avg(currentVals);
        dataSummary[type].previousWeek = {
          avg: Math.round(prevAvg * 10) / 10,
          count: prevVals.length,
        };
        dataSummary[type].changePercent =
          Math.round(((curAvg - prevAvg) / prevAvg) * 1000) / 10;
      }
    }

    if (Object.keys(dataSummary).length === 0) {
      return res.json({
        success: true,
        data: [],
        source: "no-data",
      });
    }

    // Try Gemini
    if (insightsGenAI) {
      try {
        const model = insightsGenAI.getGenerativeModel({
          model: "gemini-2.0-flash",
        });

        const prompt = `${INSIGHTS_PROMPT}\n\nData:\n${JSON.stringify(dataSummary)}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Parse the JSON array from the response
        let insights;
        try {
          // Handle possible markdown fences
          const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
          insights = JSON.parse(cleaned);
        } catch {
          console.error("Failed to parse Gemini insights response:", text);
          throw new Error("Invalid AI response format");
        }

        if (!Array.isArray(insights)) throw new Error("Expected array");

        const aiResult = insights.slice(0, 3);
        insightsCache.set(userId, {
          insights: aiResult,
          source: "ai",
          timestamp: Date.now(),
        });

        return res.json({
          success: true,
          data: aiResult,
          source: "ai",
          cached: false,
          nextRefreshAt: new Date(
            Date.now() + INSIGHTS_COOLDOWN_MS,
          ).toISOString(),
        });
      } catch (aiError) {
        console.error("Gemini insights error:", aiError.message);
        // Fall through to basic insights
      }
    }

    // Fallback: basic data-driven insights (no AI)
    const basicInsights = [];
    const thresholds = ALERT_THRESHOLDS;

    for (const [type, data] of Object.entries(dataSummary)) {
      const threshold = thresholds[type];
      const avg = data.currentWeek.avg;

      let severity = "success";
      let message = `Your ${type} averaged ${avg} ${data.unit} this week.`;
      let suggestion = "Keep tracking to see trends over time.";

      if (threshold) {
        const max = threshold.max ?? threshold.systolic?.max;
        const min = threshold.min ?? threshold.systolic?.min;
        if (avg > max) {
          severity = avg > max * 1.2 ? "critical" : "warning";
          message = `Your ${type} averaged ${avg} ${data.unit}, above the normal range.`;
          suggestion = "Consider consulting your healthcare provider.";
        } else if (avg < min) {
          severity = avg < min * 0.8 ? "critical" : "warning";
          message = `Your ${type} averaged ${avg} ${data.unit}, below the normal range.`;
          suggestion = "Monitor closely and consult your provider if concerned.";
        }
      }

      if (data.changePercent != null) {
        const dir = data.changePercent > 0 ? "up" : "down";
        message += ` That's ${Math.abs(data.changePercent)}% ${dir} from last week.`;
      }

      basicInsights.push({
        label: type.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
        icon: type === "heartRate" ? "heart" : type === "oxygenSaturation" ? "spo2" : "general",
        severity,
        message,
        suggestion,
      });
    }

    // Sort: critical > warning > success
    const order = { critical: 0, warning: 1, success: 2 };
    basicInsights.sort((a, b) => order[a.severity] - order[b.severity]);

    const basicResult = basicInsights.slice(0, 3);
    insightsCache.set(userId, {
      insights: basicResult,
      source: "basic",
      timestamp: Date.now(),
    });

    res.json({
      success: true,
      data: basicResult,
      source: "basic",
      cached: false,
      nextRefreshAt: new Date(
        Date.now() + INSIGHTS_COOLDOWN_MS,
      ).toISOString(),
    });
  } catch (error) {
    console.error("Generate AI insights error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate insights",
    });
  }
};

module.exports = {
  createMetric,
  getMetrics,
  getLatestMetrics,
  getMetricStats,
  getDailyTotals,
  deleteMetric,
  generateAIInsights,
};
