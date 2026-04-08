const mongoose = require("mongoose");
const Appointment = require("../models/Appointment.model");
const User = require("../models/User.model");
const { createAuditLog } = require("../middleware/audit.middleware");

/**
 * Create appointment
 */
const createAppointment = async (req, res) => {
  try {
    const { providerId, scheduledAt, duration, type, reason } = req.body;

    const patientId =
      req.user.role === "patient" ? req.user._id : req.body.patientId;

    // Validate provider exists
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

    // Check slot availability
    const isAvailable = await Appointment.isSlotAvailable(
      providerId,
      new Date(scheduledAt),
      duration || 30,
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Selected time slot is not available",
      });
    }

    const appointment = await Appointment.create({
      patientId,
      providerId,
      scheduledAt,
      duration: duration || 30,
      type,
      reason,
      status: "scheduled",
    });

    await appointment.populate(
      "patientId providerId",
      "profile.firstName profile.lastName email",
    );

    await createAuditLog(req.user._id, req.user.role, "create-appointment", {
      targetId: appointment._id,
      targetModel: "Appointment",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create appointment",
    });
  }
};

/**
 * Get appointments
 */
const getAppointments = async (req, res) => {
  try {
    const { status, startDate, endDate, patientId } = req.query;

    const query = {};

    // Role-based filtering
    if (req.user.role === "patient") {
      query.patientId = req.user._id;
    } else if (req.user.role === "provider") {
      query.providerId = req.user._id;
      // Allow providers to filter by a specific patient
      if (patientId) {
        query.patientId = patientId;
      }
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
      .populate(
        "providerId",
        "profile.firstName profile.lastName providerInfo.specialization",
      )
      .sort({ scheduledAt: 1 });

    res.json({
      success: true,
      data: appointments,
      count: appointments.length,
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve appointments",
    });
  }
};

/**
 * Get appointment by ID
 */
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate(
        "patientId",
        "profile.firstName profile.lastName email patientInfo",
      )
      .populate(
        "providerId",
        "profile.firstName profile.lastName providerInfo",
      );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Authorization check
    const isAuthorized =
      req.user.role === "admin" ||
      appointment.patientId._id.toString() === req.user._id.toString() ||
      appointment.providerId._id.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Get appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve appointment",
    });
  }
};

/**
 * Update appointment
 */
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Authorization check
    const isAuthorized =
      req.user.role === "admin" ||
      appointment.providerId.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { status, providerNotes, diagnosis, prescription } = req.body;

    if (status) appointment.status = status;
    if (providerNotes) appointment.providerNotes = providerNotes;
    if (diagnosis) appointment.diagnosis = diagnosis;
    if (prescription) appointment.prescription = prescription;

    if (status === "completed") {
      appointment.completedAt = new Date();
    }

    await appointment.save();

    res.json({
      success: true,
      message: "Appointment updated successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appointment",
    });
  }
};

/**
 * Cancel appointment
 */
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Authorization check
    const isAuthorized =
      appointment.patientId.toString() === req.user._id.toString() ||
      appointment.providerId.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment already cancelled",
      });
    }

    appointment.status = "cancelled";
    appointment.cancelledBy = req.user._id;
    appointment.cancellationReason = req.body.reason;
    appointment.cancelledAt = new Date();

    await appointment.save();

    await createAuditLog(req.user._id, req.user.role, "cancel-appointment", {
      targetId: appointment._id,
      targetModel: "Appointment",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
    });
  }
};

/**
 * Get provider availability
 */
const getProviderAvailability = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { date } = req.query;

    const provider = await User.findOne({ _id: providerId, role: "provider" });
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found",
      });
    }

    // Get appointments for the specified date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      providerId,
      scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["scheduled", "confirmed", "in-progress"] },
    }).select("scheduledAt duration");

    res.json({
      success: true,
      data: {
        provider: {
          id: provider._id,
          name: provider.fullName,
          availability: provider.providerInfo.availability,
        },
        bookedSlots: bookedAppointments,
        date,
      },
    });
  } catch (error) {
    console.error("Get availability error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve availability",
    });
  }
};

/**
 * Get unique patients for a provider (derived from appointments)
 */
const getProviderPatients = async (req, res) => {
  try {
    if (req.user.role !== "provider" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const providerId = req.user._id;

    const patients = await Appointment.aggregate([
      {
        $match: {
          providerId: new mongoose.Types.ObjectId(providerId),
          status: { $ne: "cancelled" }, // Exclude cancelled appointments
        },
      },
      { $group: { _id: "$patientId" } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },
      {
        $project: {
          _id: "$patient._id",
          email: "$patient.email",
          profile: "$patient.profile",
          patientInfo: "$patient.patientInfo",
        },
      },
      { $sort: { "profile.firstName": 1 } }, // Sort by first name
    ]);

    res.json({
      success: true,
      data: patients,
      count: patients.length,
    });
  } catch (error) {
    console.error("Get provider patients error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve patients",
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
  getProviderPatients,
};
