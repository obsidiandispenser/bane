const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();

router.get("/availability", async (req, res, next) => {
  try {
    const slots = await getDB().collection("availability").find().toArray();
    res.json(slots);
  } catch (error) {
    next(error);
  }
});

router.post("/availability", async (req, res, next) => {
  try {
    const { doctor, date, time } = req.body;
    if (typeof doctor !== "string" || !doctor.trim() ||
        typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date ||
        typeof time !== "string" || !/^([01]\d|2[0-3]):(00|30)$/.test(time)) {
      return res.status(400).json({ error: "Enter a doctor, valid date, and time ending in :00 or :30" });
    }
    const slot = { doctor: doctor.trim(), date, time };
    const result = await getDB().collection("availability").insertOne(slot);
    res.status(201).json({ ...slot, _id: result.insertedId });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const appointments = await getDB().collection("appointments").find().toArray();
    res.json(appointments);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    const id = new ObjectId(req.params.id);
    const appointment = await getDB().collection("appointments").findOne({ _id: id });
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { patient, slotId } = req.body;
    if (typeof patient !== "string" || !patient.trim() || typeof slotId !== "string" || !ObjectId.isValid(slotId)) {
      return res.status(400).json({ error: "Enter a patient and choose a valid slot" });
    }
    const slot = await getDB().collection("availability").findOne({ _id: new ObjectId(slotId) });
    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }
    const appointment = {
      patient: patient.trim(),
      slotId: slot._id,
      doctor: slot.doctor,
      date: slot.date,
      time: slot.time,
    };
    const result = await getDB().collection("appointments").insertOne(appointment);
    res.status(201).json({ ...appointment, _id: result.insertedId });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    const id = new ObjectId(req.params.id);
    const appointment = await getDB().collection("appointments").findOne({ _id: id });
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    if (!req.body || !Object.keys(req.body).length || Object.keys(req.body).some(field => !["patient", "slotId"].includes(field))) {
      return res.status(400).json({ error: "Only patient and slotId can be updated" });
    }
    const patient = req.body.patient ?? appointment.patient;
    const slotId = req.body.slotId ?? appointment.slotId.toString();
    if (typeof patient !== "string" || !patient.trim() || typeof slotId !== "string" || !ObjectId.isValid(slotId)) {
      return res.status(400).json({ error: "Enter a patient and choose a valid slot" });
    }
    const slot = await getDB().collection("availability").findOne({ _id: new ObjectId(slotId) });
    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }
    const updates = {
      patient: patient.trim(),
      slotId: slot._id,
      doctor: slot.doctor,
      date: slot.date,
      time: slot.time,
    };
    const result = await getDB().collection("appointments").updateOne({ _id: id }, { $set: updates });
    if (!result.matchedCount) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.json({ message: "Appointment updated" });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    const id = new ObjectId(req.params.id);
    const result = await getDB().collection("appointments").deleteOne({ _id: id });
    if (!result.deletedCount) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
