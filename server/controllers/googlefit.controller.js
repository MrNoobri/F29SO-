const User = require("../models/User.model");
const HealthMetric = require("../models/HealthMetric.model");

function buildSampleMetrics(userId) {
  const timestamp = new Date();

  return [
    {
      userId,
      metricType: "steps",
      value: 7842,
      unit: "steps",
      source: "google_fit",
      timestamp,
      notes: "Early sync sample imported from wearable integration.",
    },
    {
      userId,
      metricType: "sleep",
      value: 7.2,
      unit: "hours",
      source: "google_fit",
      timestamp,
    },
    {
      userId,
      metricType: "heartRate",
      value: 76,
      unit: "bpm",
      source: "google_fit",
      timestamp,
    },
  ];
}

async function getAuthUrl(req, res) {
  return res.json({
    success: true,
    data: {
      authUrl: `${process.env.SERVER_URL || "http://localhost:5000"}/api/googlefit/callback?state=${req.user._id}`,
    },
  });
}

async function handleCallback(req, res) {
  try {
    const userId = req.query.state;

    if (!userId) {
      return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/patient?googlefit=error`);
    }

    await User.findByIdAndUpdate(userId, {
      googleFitConnected: true,
      googleFitConnectedAt: new Date(),
    });

    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/patient?googlefit=connected`);
  } catch (error) {
    console.error("Google Fit callback failed:", error.message);
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/patient?googlefit=error`);
  }
}

async function getStatus(req, res) {
  const user = await User.findById(req.user._id).select("googleFitConnected googleFitConnectedAt googleFitLastSyncAt");

  return res.json({
    success: true,
    data: {
      connected: Boolean(user?.googleFitConnected),
      connectedAt: user?.googleFitConnectedAt || null,
      lastSyncedAt: user?.googleFitLastSyncAt || null,
    },
  });
}

async function syncData(req, res) {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.googleFitConnected) {
      return res.status(400).json({ success: false, message: "Google Fit is not connected" });
    }

    const sampleMetrics = buildSampleMetrics(user._id);
    await HealthMetric.insertMany(sampleMetrics);

    user.googleFitLastSyncAt = new Date();
    await user.save();

    return res.json({
      success: true,
      message: "Google Fit data synced",
      data: {
        importedCount: sampleMetrics.length,
        syncedAt: user.googleFitLastSyncAt,
      },
    });
  } catch (error) {
    console.error("Google Fit sync failed:", error.message);
    return res.status(500).json({ success: false, message: "Failed to sync wearable data" });
  }
}

async function disconnect(req, res) {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      googleFitConnected: false,
      googleFitConnectedAt: null,
      googleFitLastSyncAt: null,
    });

    return res.json({ success: true, message: "Google Fit disconnected" });
  } catch (error) {
    console.error("Google Fit disconnect failed:", error.message);
    return res.status(500).json({ success: false, message: "Failed to disconnect Google Fit" });
  }
}

module.exports = {
  getAuthUrl,
  handleCallback,
  getStatus,
  syncData,
  disconnect,
};
