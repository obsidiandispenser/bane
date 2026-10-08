const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const router = express.Router();
router.param("id", (req, res, next, id) => {
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  req.recordId = new ObjectId(id);
  next();
});
function validate(body, creating) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Body must be an object";
  if (Object.keys(body).some(field => !["amount", "category", "date", "description"].includes(field))) return "Unknown field; _id cannot be changed";
  if (!Object.keys(body).length) return "Provide record fields";
  if ((creating || body.amount !== undefined) && (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount < 0 || body.amount === 0)) return "Invalid amount";
  if ((creating || body.category !== undefined) && (typeof body.category !== "string" || !body.category.trim())) return "Invalid category";
  if ((creating || body.date !== undefined) && (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date) || !Number.isFinite(Date.parse(body.date)) || new Date(body.date).toISOString().slice(0, 10) !== body.date)) return "Invalid date";
  if ((creating || body.description !== undefined) && (typeof body.description !== "string" || !body.description.trim())) return "Invalid description";
  return null;
}
router.get("/", async (req, res) => {
  try {
    const records = await getDB().collection("expenses").find().toArray();
    res.json(records);
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.get("/:id", async (req, res) => {
  try {
    const record = await getDB().collection("expenses").findOne({ _id: req.recordId });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.post("/", async (req, res) => {
  const error = validate(req.body, true);
  if (error) return res.status(400).json({ error });
  try {
    const record = req.body;
    const result = await getDB().collection("expenses").insertOne(record);
    res.status(201).json({ ...record, _id: result.insertedId });
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.patch("/:id", async (req, res) => {
  const error = validate(req.body, false);
  if (error) return res.status(400).json({ error });
  try {
    const records = getDB().collection("expenses");
    const result = await records.updateOne({ _id: req.recordId }, { $set: req.body });
    if (!result.matchedCount) return res.status(404).json({ error: "Record not found" });
    const record = await records.findOne({ _id: req.recordId });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.delete("/:id", async (req, res) => {
  try {
    const result = await getDB().collection("expenses").deleteOne({ _id: req.recordId });
    if (!result.deletedCount) return res.status(404).json({ error: "Record not found" });
    res.status(204).send();
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
module.exports = router;
