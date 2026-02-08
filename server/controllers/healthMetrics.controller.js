const HealthMetric = require("../models/HealthMetric.model");

const createMetric = async (req, res) => {
  try {
    const { metricType, value, unit, source, timestamp, notes } = req.body;

    const metric = await HealthMetric.create({
      userId: req.user?._id || req.body.userId,
      metricType,
      value,
      unit,
      source: source || "manual",
      timestamp: timestamp || new Date(),
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Health metric recorded successfully",
      data: metric,
    });
  } catch (error) {
    console.error("Create metric error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create health metric",
    });
  }
};

const getMetrics = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id;
    const { metricType, startDate, endDate, limit = 50 } = req.query;

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
      .limit(Number(limit));

    return res.json({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  } catch (error) {
    console.error("Get metrics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve health metrics",
    });
  }
};

const getLatestMetrics = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id;
    const metricTypes = [
      "steps",
      "sleep",
      "heartRate",
      "bloodPressure",
      "bloodGlucose",
      "weight",
    ];

    const latestMetrics = {};

    for (const type of metricTypes) {
      const metric = await HealthMetric.getLatest(userId, type);
      if (metric) {
        latestMetrics[type] = metric;
      }
    }

    return res.json({
      success: true,
      data: latestMetrics,
    });
  } catch (error) {
    console.error("Get latest metrics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve latest metrics",
    });
  }
};

module.exports = {
  createMetric,
  getMetrics,
  getLatestMetrics,
};
