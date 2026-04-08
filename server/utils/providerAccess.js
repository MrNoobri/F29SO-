const Appointment = require("../models/Appointment.model");
const mongoose = require("mongoose");

/**
 * Returns true if the provider has at least one non-cancelled appointment
 * with the given patient, false otherwise.
 */
const providerHasPatient = async (providerId, patientId) => {
  const exists = await Appointment.exists({
    providerId: new mongoose.Types.ObjectId(providerId),
    patientId: new mongoose.Types.ObjectId(patientId),
    status: { $ne: "cancelled" },
  });
  return !!exists;
};

/**
 * From a list of patient IDs, returns only those the provider has access to.
 */
const filterAllowedPatients = async (providerId, patientIds) => {
  const appointments = await Appointment.find({
    providerId: new mongoose.Types.ObjectId(providerId),
    patientId: { $in: patientIds.map((id) => new mongoose.Types.ObjectId(id)) },
    status: { $ne: "cancelled" },
  }).distinct("patientId");

  const allowed = new Set(appointments.map((id) => id.toString()));
  return patientIds.filter((id) => allowed.has(id.toString()));
};

module.exports = { providerHasPatient, filterAllowedPatients };
