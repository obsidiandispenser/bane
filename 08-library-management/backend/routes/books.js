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
  if (Object.keys(body).some(field => !["title", "author", "isbn", "available"].includes(field))) return "Unknown field; _id cannot be changed";
  if (!Object.keys(body).length) return "Provide record fields";
  if ((creating || body.title !== undefined) && (typeof body.title !== "string" || !body.title.trim())) return "Invalid title";
  if ((creating || body.author !== undefined) && (typeof body.author !== "string" || !body.author.trim())) return "Invalid author";
  if ((creating || body.isbn !== undefined) && (typeof body.isbn !== "string" || !body.isbn.trim())) return "Invalid isbn";
  if ((creating || body.available !== undefined) && (typeof body.available !== "boolean")) return "Invalid available";
  return null;
}
router.get("/", async (req, res) => {
  try {
    const records = await getDB().collection("books").find().toArray();
    res.json(records);
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.get("/:id", async (req, res) => {
  try {
    const record = await getDB().collection("books").findOne({ _id: req.recordId });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.post("/", async (req, res) => {
  const error = validate(req.body, true);
  if (error) return res.status(400).json({ error });
  try {
    const record = req.body;
    const result = await getDB().collection("books").insertOne(record);
    res.status(201).json({ ...record, _id: result.insertedId });
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.patch("/:id", async (req, res) => {
  const error = validate(req.body, false);
  if (error) return res.status(400).json({ error });
  try {
    const records = getDB().collection("books");
    const result = await records.updateOne({ _id: req.recordId }, { $set: req.body });
    if (!result.matchedCount) return res.status(404).json({ error: "Record not found" });
    const record = await records.findOne({ _id: req.recordId });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.delete("/:id", async (req, res) => {
  try {
    const result = await getDB().collection("books").deleteOne({ _id: req.recordId });
    if (!result.deletedCount) return res.status(404).json({ error: "Record not found" });
    res.status(204).send();
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
module.exports = router;
