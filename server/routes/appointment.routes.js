const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment.controller");
const { authenticate } = require("../middleware/auth.middleware");

// All routes require authentication
router.use(authenticate);

// Create appointment
router.post("/", appointmentController.createAppointment);

// Get appointments
router.get("/", appointmentController.getAppointments);

// Get provider's patients (must be before /:id)
router.get("/provider/patients", appointmentController.getProviderPatients);

// Get provider availability
router.get(
  "/availability/:providerId",
  appointmentController.getProviderAvailability,
);

// Get appointment by ID
router.get("/:id", appointmentController.getAppointmentById);

// Update appointment (provider only)
router.patch("/:id", appointmentController.updateAppointment);

// Cancel appointment
router.post("/:id/cancel", appointmentController.cancelAppointment);

module.exports = router;
