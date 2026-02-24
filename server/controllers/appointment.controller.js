const Appointment = require("../models/Appointment.model");
const User = require("../models/User.model");

const createAppointment = async (req, res) => {
  try {
    const {
      providerId,
      patientId,
      scheduledAt,
      duration = 30,
      type = "consultation",
      reason,
      notes = "",
    } = req.body;

    const resolvedPatientId = req.user?.role === "patient" ? req.user._id : patientId;

    if (!providerId || !resolvedPatientId || !scheduledAt || !reason) {
      return res.status(400).json({
        success: false,
        message: "providerId, patientId, scheduledAt, and reason are required",
      });
    }

    const provider = await User.findOne({
      _id: providerId,
      role: "provider",
      isActive: true,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    const isAvailable = await Appointment.isSlotAvailable(
      providerId,
      new Date(scheduledAt),
      Number(duration),
    );

    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: "Selected slot is not available",
      });
    }

    const appointment = await Appointment.create({
      patientId: resolvedPatientId,
      providerId,
      scheduledAt,
      duration: Number(duration),
      type,
      reason,
      notes,
    });

    await appointment.populate([
      { path: "patientId", select: "profile.firstName profile.lastName email" },
      { path: "providerId", select: "profile.firstName profile.lastName email" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create appointment",
    });
  }
};

const getAppointments = async (req, res) => {
  try {
    const { status, startDate, endDate, role, userId } = req.query;
    const query = {};

    if (req.user?.role === "patient") {
      query.patientId = req.user._id;
    } else if (req.user?.role === "provider") {
      query.providerId = req.user._id;
    } else {
      if (role === "patient" && userId) query.patientId = userId;
      if (role === "provider" && userId) query.providerId = userId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.scheduledAt = {};
      if (startDate) query.scheduledAt.$gte = new Date(startDate);
      if (endDate) query.scheduledAt.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .populate("patientId", "profile.firstName profile.lastName email")
      .populate("providerId", "profile.firstName profile.lastName email")
      .sort({ scheduledAt: 1 });

    return res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve appointments",
    });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "profile.firstName profile.lastName email")
      .populate("providerId", "profile.firstName profile.lastName email");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Get appointment by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve appointment",
    });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const allowedUpdates = ["scheduledAt", "duration", "status", "type", "reason", "notes"];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const existingAppointment = await Appointment.findById(req.params.id);

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (updates.scheduledAt || updates.duration) {
      const nextScheduledAt = updates.scheduledAt || existingAppointment.scheduledAt;
      const nextDuration = Number(updates.duration || existingAppointment.duration);

      const isAvailable = await Appointment.isSlotAvailable(
        existingAppointment.providerId,
        new Date(nextScheduledAt),
        nextDuration,
        existingAppointment._id,
      );

      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          message: "Updated slot is not available",
        });
      }
    }

    if (updates.status === "completed") {
      updates.completedAt = new Date();
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    )
      .populate("patientId", "profile.firstName profile.lastName email")
      .populate("providerId", "profile.firstName profile.lastName email");

    return res.json({
      success: true,
      message: "Appointment updated successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update appointment",
    });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { reason = "Cancelled by user" } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status: "cancelled",
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
      { new: true },
    )
      .populate("patientId", "profile.firstName profile.lastName email")
      .populate("providerId", "profile.firstName profile.lastName email");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
    });
  }
};

const getProviderAvailability = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      providerId,
      status: { $in: ["scheduled", "confirmed"] },
      scheduledAt: {
        $gte: dayStart,
        $lte: dayEnd,
      },
    }).select("scheduledAt duration");

    const bookedSlots = bookedAppointments.map((appointment) => ({
      scheduledAt: appointment.scheduledAt,
      duration: appointment.duration,
    }));

    return res.json({
      success: true,
      data: {
        providerId,
        date: dayStart,
        bookedSlots,
      },
    });
  } catch (error) {
    console.error("Get provider availability error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve provider availability",
    });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getProviderAvailability,
};
