const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const students = await getDB().collection("students").find().toArray();
    res.json(students);
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
    const student = await getDB().collection("students").findOne({ _id: id });
    if (!student) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(student);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!req.body || Array.isArray(req.body) || Object.keys(req.body).some(field => !["name", "rollNumber", "course", "email"].includes(field))) {
      return res.status(400).json({ error: "Invalid fields" });
    }
    const student = {
      name: req.body.name,
      rollNumber: req.body.rollNumber,
      course: req.body.course,
      email: req.body.email,
    };
    const result = await getDB().collection("students").insertOne(student);
    res.status(201).json({ ...student, _id: result.insertedId });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    if (!req.body || Array.isArray(req.body) || Object.keys(req.body).some(field => !["name", "rollNumber", "course", "email"].includes(field))) {
      return res.status(400).json({ error: "Invalid fields" });
    }
    if (!Object.keys(req.body).length) {
      return res.status(400).json({ error: "Provide fields to update" });
    }
    const id = new ObjectId(req.params.id);
    const result = await getDB().collection("students").updateOne(
      { _id: id },
      { $set: req.body }
    );
    if (!result.matchedCount) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json({ message: "Student updated" });
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
    const result = await getDB().collection("students").deleteOne({ _id: id });
    if (!result.deletedCount) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
