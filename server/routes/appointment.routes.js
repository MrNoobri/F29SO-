const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);

router.post("/", appointmentController.createAppointment);
router.get("/", appointmentController.getAppointments);
router.get("/availability/:providerId", appointmentController.getProviderAvailability);
router.get("/:id", appointmentController.getAppointmentById);
router.patch("/:id", appointmentController.updateAppointment);
router.post("/:id/cancel", appointmentController.cancelAppointment);

module.exports = router;
