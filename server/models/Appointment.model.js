const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    duration: {
      type: Number,
      default: 30,
      min: 15,
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "completed", "cancelled"],
      default: "scheduled",
    },
    type: {
      type: String,
      enum: ["consultation", "follow-up", "routine-checkup"],
      default: "consultation",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: "",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

appointmentSchema.index({ patientId: 1, scheduledAt: -1 });
appointmentSchema.index({ providerId: 1, scheduledAt: -1 });

appointmentSchema.virtual("endsAt").get(function () {
  return new Date(this.scheduledAt.getTime() + this.duration * 60 * 1000);
});

appointmentSchema.statics.isSlotAvailable = async function (
  providerId,
  scheduledAt,
  duration = 30,
  excludeId = null,
) {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const query = {
    providerId,
    status: { $in: ["scheduled", "confirmed"] },
    scheduledAt: {
      $lt: end,
      $gte: new Date(start.getTime() - 6 * 60 * 60 * 1000),
    },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingAppointments = await this.find(query);

  const hasConflict = existingAppointments.some((appointment) => {
    const existingStart = new Date(appointment.scheduledAt);
    const existingEnd = new Date(
      existingStart.getTime() + appointment.duration * 60 * 1000,
    );

    return start < existingEnd && end > existingStart;
  });

  return !hasConflict;
};

module.exports = mongoose.model("Appointment", appointmentSchema);
