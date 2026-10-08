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
  if (Object.keys(body).some(field => !["name", "department", "role", "salary"].includes(field))) return "Unknown field; _id cannot be changed";
  if (!Object.keys(body).length) return "Provide record fields";
  if ((creating || body.name !== undefined) && (typeof body.name !== "string" || !body.name.trim())) return "Invalid name";
  if ((creating || body.department !== undefined) && (typeof body.department !== "string" || !body.department.trim())) return "Invalid department";
  if ((creating || body.role !== undefined) && (typeof body.role !== "string" || !body.role.trim())) return "Invalid role";
  if ((creating || body.salary !== undefined) && (typeof body.salary !== "number" || !Number.isFinite(body.salary) || body.salary < 0)) return "Invalid salary";
  return null;
}
router.get("/", async (req, res) => {
  try {
    const records = await getDB().collection("employees").find().toArray();
    res.json(records);
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.get("/:id", async (req, res) => {
  try {
    const record = await getDB().collection("employees").findOne({ _id: req.recordId });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.post("/", async (req, res) => {
  const error = validate(req.body, true);
  if (error) return res.status(400).json({ error });
  try {
    const record = req.body;
    const result = await getDB().collection("employees").insertOne(record);
    res.status(201).json({ ...record, _id: result.insertedId });
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.patch("/:id", async (req, res) => {
  const error = validate(req.body, false);
  if (error) return res.status(400).json({ error });
  try {
    const records = getDB().collection("employees");
    const result = await records.updateOne({ _id: req.recordId }, { $set: req.body });
    if (!result.matchedCount) return res.status(404).json({ error: "Record not found" });
    const record = await records.findOne({ _id: req.recordId });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.delete("/:id", async (req, res) => {
  try {
    const result = await getDB().collection("employees").deleteOne({ _id: req.recordId });
    if (!result.deletedCount) return res.status(404).json({ error: "Record not found" });
    res.status(204).send();
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
module.exports = router;
