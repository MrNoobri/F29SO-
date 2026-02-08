const mongoose = require("mongoose");

const healthMetricSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    metricType: {
      type: String,
      enum: [
        "steps",
        "sleep",
        "heartRate",
        "bloodPressure",
        "bloodGlucose",
        "weight",
        "calories",
        "waterIntake",
      ],
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      enum: ["manual", "google_fit", "fitbit", "simulator"],
      default: "manual",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  },
);

healthMetricSchema.index({ userId: 1, metricType: 1, timestamp: -1 });

healthMetricSchema.statics.getLatest = function (userId, metricType) {
  return this.findOne({ userId, metricType }).sort({ timestamp: -1 }).exec();
};

const HealthMetric = mongoose.model("HealthMetric", healthMetricSchema);

module.exports = HealthMetric;
