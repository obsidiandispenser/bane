const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const router = express.Router();
function databaseError(error, res) {
  if (error.code === 11000) return res.status(409).json({ error: "This slot already exists or is booked. Choose another slot." });
  console.error(error); res.status(500).json({ error: "Database error" });
}
function validDate(date) {
  return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}
// Place availability routes before /:id.
router.get("/availability", async (req, res) => {
  try { res.json(await getDB().collection("availability").find().sort({ date: 1, time: 1 }).toArray()); }
  catch (error) { databaseError(error, res); }
});
router.post("/availability", async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(key => !["doctor", "date", "time"].includes(key)) ||
      typeof body.doctor !== "string" || !body.doctor.trim() || !validDate(body.date) ||
      typeof body.time !== "string" || !/^([01]\d|2[0-3]):(00|30)$/.test(body.time)) {
    return res.status(400).json({ error: "Provide doctor, a valid date, and a time in 30-minute steps" });
  }
  try {
    const slot = { doctor: body.doctor.trim(), date: body.date, time: body.time };
    const result = await getDB().collection("availability").insertOne(slot);
    res.status(201).json({ ...slot, _id: result.insertedId });
  } catch (error) { databaseError(error, res); }
});
router.param("id", (req, res, next, id) => {
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  req.appointmentId = new ObjectId(id); next();
});
function validate(body, creating) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Body must be an object";
  if (!Object.keys(body).length || Object.keys(body).some(key => !["patient", "slotId"].includes(key))) return "Only patient and slotId are accepted";
  if ((creating || body.patient !== undefined) && (typeof body.patient !== "string" || !body.patient.trim())) return "Patient name is required";
  if ((creating || body.slotId !== undefined) && (typeof body.slotId !== "string" || !ObjectId.isValid(body.slotId))) return "Invalid slot ID";
  return null;
}
router.get("/", async (req, res) => {
  try { res.json(await getDB().collection("appointments").find().sort({ date: 1, time: 1 }).toArray()); }
  catch (error) { databaseError(error, res); }
});
router.get("/:id", async (req, res) => {
  try {
    const appointment = await getDB().collection("appointments").findOne({ _id: req.appointmentId });
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json(appointment);
  } catch (error) { databaseError(error, res); }
});
router.post("/", async (req, res) => {
  const error = validate(req.body, true);
  if (error) return res.status(400).json({ error });
  try {
    const db = getDB();
    const slot = await db.collection("availability").findOne({ _id: new ObjectId(req.body.slotId) });
    if (!slot) return res.status(404).json({ error: "Availability slot not found" });
    const appointment = { patient: req.body.patient.trim(), slotId: slot._id, doctor: slot.doctor, date: slot.date, time: slot.time };
    // The unique slotId index rejects even simultaneous bookings of the same slot.
    const result = await db.collection("appointments").insertOne(appointment);
    res.status(201).json({ ...appointment, _id: result.insertedId });
  } catch (error) { databaseError(error, res); }
});
router.patch("/:id", async (req, res) => {
  const error = validate(req.body, false);
  if (error) return res.status(400).json({ error });
  try {
    const db = getDB(); const appointments = db.collection("appointments");
    const existing = await appointments.findOne({ _id: req.appointmentId });
    if (!existing) return res.status(404).json({ error: "Appointment not found" });
    const updates = {};
    if (req.body.patient !== undefined) updates.patient = req.body.patient.trim();
    if (req.body.slotId !== undefined) {
      const slot = await db.collection("availability").findOne({ _id: new ObjectId(req.body.slotId) });
      if (!slot) return res.status(404).json({ error: "Availability slot not found" });
      Object.assign(updates, { slotId: slot._id, doctor: slot.doctor, date: slot.date, time: slot.time });
    }
    // A single atomic update keeps the original booking intact if the new slot conflicts.
    const result = await appointments.updateOne({ _id: req.appointmentId }, { $set: updates });
    if (!result.matchedCount) return res.status(404).json({ error: "Appointment not found" });
    const appointment = await appointments.findOne({ _id: req.appointmentId });
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json(appointment);
  } catch (error) { databaseError(error, res); }
});
router.delete("/:id", async (req, res) => {
  try {
    const result = await getDB().collection("appointments").deleteOne({ _id: req.appointmentId });
    if (!result.deletedCount) return res.status(404).json({ error: "Appointment not found" });
    res.status(204).send();
  } catch (error) { databaseError(error, res); }
});
module.exports = router;
