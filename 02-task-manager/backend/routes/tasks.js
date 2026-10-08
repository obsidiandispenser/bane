const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();

// Validate IDs before any database operation on a single task.
router.param("id", (req, res, next, id) => {
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid task ID" });
  }
  req.taskId = new ObjectId(id);
  next();
});

// Both creation and updates accept only these fields and their stated types.
function validateTask(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Body must be an object";
  }
  for (const field of Object.keys(body)) {
    if (!["title", "description", "completed"].includes(field)) {
      return "Only title, description, and completed are allowed";
    }
  }
  if (body.title !== undefined &&
      (typeof body.title !== "string" || !body.title.trim())) {
    return "Title must be a non-empty string";
  }
  if (body.description !== undefined && typeof body.description !== "string") {
    return "Description must be a string";
  }
  if (body.completed !== undefined && typeof body.completed !== "boolean") {
    return "Completed must be a boolean";
  }
  return null;
}

router.get("/", async (req, res) => {
  try {
    const tasks = await getDB().collection("tasks").find().toArray();
    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const task = await getDB().collection("tasks").findOne({ _id: req.taskId });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/", async (req, res) => {
  const validationError = validateTask(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  if (req.body.title === undefined) {
    return res.status(400).json({ error: "Title is required" });
  }

  const task = {
    title: req.body.title,
    description: req.body.description === undefined ? "" : req.body.description,
    completed: req.body.completed === undefined ? false : req.body.completed,
  };
  try {
    const result = await getDB().collection("tasks").insertOne(task);
    res.status(201).json({ ...task, _id: result.insertedId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

router.patch("/:id", async (req, res) => {
  const validationError = validateTask(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Provide at least one task field" });
  }

  try {
    const tasks = getDB().collection("tasks");
    const result = await tasks.updateOne(
      { _id: req.taskId },
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    const task = await tasks.findOne({ _id: req.taskId });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await getDB().collection("tasks").deleteOne({ _id: req.taskId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
