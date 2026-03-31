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
      default: 30, // minutes
      required: true,
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "in-progress",
        "completed",
        "cancelled",
        "no-show",
      ],
      default: "scheduled",
      required: true,
    },
    type: {
      type: String,
      enum: ["consultation", "follow-up", "emergency", "routine-checkup"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    notes: String,
    providerNotes: String,
    diagnosis: String,
    prescription: [String],
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancellationReason: String,
    cancelledAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  },
);

// Compound indexes for efficient queries
appointmentSchema.index({ patientId: 1, scheduledAt: -1 });
appointmentSchema.index({ providerId: 1, scheduledAt: -1 });
appointmentSchema.index({ status: 1, scheduledAt: 1 });

// Virtual for end time
appointmentSchema.virtual("endsAt").get(function () {
  return new Date(this.scheduledAt.getTime() + this.duration * 60000);
});

// Static method to check availability
appointmentSchema.statics.isSlotAvailable = async function (
  providerId,
  scheduledAt,
  duration,
) {
  const endTime = new Date(scheduledAt.getTime() + duration * 60000);

  const conflictingAppointment = await this.findOne({
    providerId,
    status: { $in: ["scheduled", "confirmed", "in-progress"] },
    $or: [
      {
        scheduledAt: { $lt: endTime },
        $expr: {
          $gt: [
            { $add: ["$scheduledAt", { $multiply: ["$duration", 60000] }] },
            scheduledAt,
          ],
        },
      },
    ],
  });

  return !conflictingAppointment;
};

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
