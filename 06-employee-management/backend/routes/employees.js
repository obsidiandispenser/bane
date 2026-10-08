const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const employees = await getDB().collection("employees").find().toArray();
    res.json(employees);
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
    const employee = await getDB().collection("employees").findOne({ _id: id });
    if (!employee) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(employee);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!req.body || Array.isArray(req.body) || Object.keys(req.body).some(field => !["name", "department", "role", "salary"].includes(field))) {
      return res.status(400).json({ error: "Invalid fields" });
    }
    const employee = {
      name: req.body.name,
      department: req.body.department,
      role: req.body.role,
      salary: req.body.salary,
    };
    const result = await getDB().collection("employees").insertOne(employee);
    res.status(201).json({ ...employee, _id: result.insertedId });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    if (!req.body || Array.isArray(req.body) || Object.keys(req.body).some(field => !["name", "department", "role", "salary"].includes(field))) {
      return res.status(400).json({ error: "Invalid fields" });
    }
    if (!Object.keys(req.body).length) {
      return res.status(400).json({ error: "Provide fields to update" });
    }
    const id = new ObjectId(req.params.id);
    const result = await getDB().collection("employees").updateOne(
      { _id: id },
      { $set: req.body }
    );
    if (!result.matchedCount) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json({ message: "Employee updated" });
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
    const result = await getDB().collection("employees").deleteOne({ _id: id });
    if (!result.deletedCount) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
