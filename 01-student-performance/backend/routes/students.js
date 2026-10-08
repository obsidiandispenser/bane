const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();
router.get("/", async (req, res) => {
  const students = await getDB().collection("students").find().toArray();
  res.json(students);
});
router.post("/", async (req, res) => {
  const student = req.body;
  const result = await getDB().collection("students").insertOne(student);
  res.json(result);
});
router.patch("/:id", async (req, res) => {
  const id = new ObjectId(req.params.id);

  await getDB().collection("students").updateOne(
    { _id: id },
    { $set: req.body }
  );

  res.json({ message: "Student updated" });
});
router.delete("/:id", async (req, res) => {
  const id = new ObjectId(req.params.id);

  await getDB().collection("students").deleteOne({ _id: id });

  res.json({ message: "Student deleted" });
});

module.exports = router;
