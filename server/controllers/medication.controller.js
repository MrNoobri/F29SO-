const Medication = require("../models/Medication.model");
const Alert = require("../models/Alert.model");
const { awardXP } = require("./gamification.controller");
const { providerHasPatient } = require("../utils/providerAccess");

const createMedication = async (req, res) => {
  try {
    const { name, dosage, frequency, times, startDate, endDate, notes, userId } = req.body;

    if (!name || !dosage || !frequency) {
      return res.status(400).json({ message: "Name, dosage, and frequency are required" });
    }

    const medData = {
      userId: req.user.role === "provider" && userId ? userId : req.user._id,
      name,
      dosage,
      frequency,
      times: times || [],
      startDate: startDate || new Date(),
      endDate: endDate || null,
      notes,
      prescribedBy: req.user.role === "provider" ? req.user._id : undefined,
    };

    const medication = await Medication.create(medData);
    res.status(201).json({ data: medication });
  } catch (error) {
    console.error("Error creating medication:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getMedications = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    if (req.user.role === "provider" && userId.toString() !== req.user._id.toString()) {
      const allowed = await providerHasPatient(req.user._id, userId);
      if (!allowed) return res.status(403).json({ message: "Access denied" });
    }

    const { active } = req.query;
    const query = { userId };
    if (active !== undefined) {
      query.isActive = active === "true";
    }

    const medications = await Medication.find(query)
      .populate("prescribedBy", "profile.firstName profile.lastName")
      .sort({ createdAt: -1 });

    res.json({ data: medications });
  } catch (error) {
    console.error("Error getting medications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateMedication = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ message: "Medication not found" });
    }
    if (medication.userId.toString() !== req.user._id.toString() && req.user.role !== "provider") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const allowed = ["name", "dosage", "frequency", "times", "endDate", "notes", "isActive"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) medication[field] = req.body[field];
    });

    await medication.save();
    res.json({ data: medication });
  } catch (error) {
    console.error("Error updating medication:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteMedication = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ message: "Medication not found" });
    }
    if (medication.userId.toString() !== req.user._id.toString() && req.user.role !== "provider") {
      return res.status(403).json({ message: "Not authorized" });
    }

    medication.isActive = false;
    await medication.save();
    res.json({ message: "Medication deactivated" });
  } catch (error) {
    console.error("Error deactivating medication:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const hardDeleteMedication = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ message: "Medication not found" });
    }
    if (medication.userId.toString() !== req.user._id.toString() && req.user.role !== "provider") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Medication.deleteOne({ _id: req.params.id });
    res.json({ message: "Medication permanently deleted" });
  } catch (error) {
    console.error("Error deleting medication:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const logAdherence = async (req, res) => {
  try {
    const { taken, skipReason, timeslot } = req.body;
    const medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({ message: "Medication not found" });
    }
    if (medication.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if already logged for this timeslot today
    const existing = medication.adherenceLog.find(
      (log) => log.date >= todayStart && log.timeslot === (timeslot || "default"),
    );
    if (existing) {
      return res.status(400).json({ message: "Already logged for this timeslot today" });
    }

    medication.adherenceLog.push({
      date: now,
      timeslot: timeslot || "default",
      taken: !!taken,
      takenAt: taken ? now : undefined,
      skipped: !taken,
      skipReason: !taken ? skipReason : undefined,
    });

    await medication.save();

    if (taken) {
      await awardXP(req.user._id, "take_medication");
    } else {
      // Generate alert for missed dose
      await Alert.create({
        userId: medication.userId,
        type: "medication",
        severity: "warning",
        title: `Missed dose: ${medication.name}`,
        message: `${medication.name} ${medication.dosage} was skipped${skipReason ? `: ${skipReason}` : ""}.`,
      });
    }

    res.json({ data: medication });
  } catch (error) {
    console.error("Error logging adherence:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAdherenceStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    if (req.user.role === "provider" && userId.toString() !== req.user._id.toString()) {
      const allowed = await providerHasPatient(req.user._id, userId);
      if (!allowed) return res.status(403).json({ message: "Access denied" });
    }

    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const medications = await Medication.find({ userId, isActive: true });

    let totalExpected = 0;
    let totalTaken = 0;
    const dailyBreakdown = {};

    for (const med of medications) {
      const logs = med.adherenceLog.filter((l) => l.date >= since);
      for (const log of logs) {
        const dateKey = log.date.toISOString().split("T")[0];
        if (!dailyBreakdown[dateKey]) dailyBreakdown[dateKey] = { taken: 0, missed: 0, total: 0 };
        dailyBreakdown[dateKey].total += 1;
        if (log.taken) {
          dailyBreakdown[dateKey].taken += 1;
          totalTaken += 1;
        } else {
          dailyBreakdown[dateKey].missed += 1;
        }
        totalExpected += 1;
      }
    }

    const adherenceRate = totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 0;

    res.json({
      data: {
        adherenceRate,
        totalExpected,
        totalTaken,
        dailyBreakdown,
      },
    });
  } catch (error) {
    console.error("Error getting adherence stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const medications = await Medication.find({ userId, isActive: true });

    const todayMeds = medications.map((med) => {
      const todayLogs = med.adherenceLog.filter((l) => l.date >= todayStart);
      const timeslots = med.times.length > 0 ? med.times : ["default"];

      const slots = timeslots.map((time) => {
        const log = todayLogs.find((l) => l.timeslot === time);
        return {
          time,
          status: log ? (log.taken ? "taken" : "skipped") : "pending",
          logId: log?._id,
        };
      });

      return {
        _id: med._id,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        slots,
      };
    });

    res.json({ data: todayMeds });
  } catch (error) {
    console.error("Error getting today status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createMedication,
  getMedications,
  updateMedication,
  deleteMedication,
  hardDeleteMedication,
  logAdherence,
  getAdherenceStats,
  getTodayStatus,
};
