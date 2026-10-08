const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const expenses = await getDB().collection("expenses").find().toArray();
    res.json(expenses);
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
    const expense = await getDB().collection("expenses").findOne({ _id: id });
    if (!expense) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(expense);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!req.body || Array.isArray(req.body) || Object.keys(req.body).some(field => !["amount", "category", "date", "description"].includes(field))) {
      return res.status(400).json({ error: "Invalid fields" });
    }
    const expense = {
      amount: req.body.amount,
      category: req.body.category,
      date: req.body.date,
      description: req.body.description,
    };
    const result = await getDB().collection("expenses").insertOne(expense);
    res.status(201).json({ ...expense, _id: result.insertedId });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    if (!req.body || Array.isArray(req.body) || Object.keys(req.body).some(field => !["amount", "category", "date", "description"].includes(field))) {
      return res.status(400).json({ error: "Invalid fields" });
    }
    if (!Object.keys(req.body).length) {
      return res.status(400).json({ error: "Provide fields to update" });
    }
    const id = new ObjectId(req.params.id);
    const result = await getDB().collection("expenses").updateOne(
      { _id: id },
      { $set: req.body }
    );
    if (!result.matchedCount) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json({ message: "Expense updated" });
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
    const result = await getDB().collection("expenses").deleteOne({ _id: id });
    if (!result.deletedCount) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
