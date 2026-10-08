const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const tasks = await getDB().collection("tasks").find().toArray();
    res.json(tasks);
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
    const task = await getDB().collection("tasks").findOne({ _id: id });
    if (!task) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!req.body || Array.isArray(req.body) || Object.keys(req.body).some(field => !["title", "description", "completed"].includes(field))) {
      return res.status(400).json({ error: "Invalid fields" });
    }
    if ((typeof req.body.title !== "string" || !req.body.title.trim()) ||
        (req.body.description !== undefined && (typeof req.body.description !== "string")) ||
        (req.body.completed !== undefined && (typeof req.body.completed !== "boolean"))) {
      return res.status(400).json({ error: "Invalid task values" });
    }
    const task = {
      title: req.body.title,
      description: req.body.description ?? "",
      completed: req.body.completed ?? false,
    };
    const result = await getDB().collection("tasks").insertOne(task);
    res.status(201).json({ ...task, _id: result.insertedId });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    if (!req.body || Array.isArray(req.body) || Object.keys(req.body).some(field => !["title", "description", "completed"].includes(field))) {
      return res.status(400).json({ error: "Invalid fields" });
    }
    if (!Object.keys(req.body).length ||
        (req.body.title !== undefined && (typeof req.body.title !== "string" || !req.body.title.trim())) ||
        (req.body.description !== undefined && (typeof req.body.description !== "string")) ||
        (req.body.completed !== undefined && (typeof req.body.completed !== "boolean"))) {
      return res.status(400).json({ error: "Invalid task values" });
    }
    const id = new ObjectId(req.params.id);
    const result = await getDB().collection("tasks").updateOne(
      { _id: id },
      { $set: req.body }
    );
    if (!result.matchedCount) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json({ message: "Task updated" });
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
    const result = await getDB().collection("tasks").deleteOne({ _id: id });
    if (!result.deletedCount) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
