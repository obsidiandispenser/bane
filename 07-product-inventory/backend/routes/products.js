const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const products = await getDB().collection("products").find().toArray();
    res.json(products);
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
    const product = await getDB().collection("products").findOne({ _id: id });
    if (!product) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!req.body || Array.isArray(req.body) || Object.keys(req.body).some(field => !["name", "price", "quantity", "category"].includes(field))) {
      return res.status(400).json({ error: "Invalid fields" });
    }
    const product = {
      name: req.body.name,
      price: req.body.price,
      quantity: req.body.quantity,
      category: req.body.category,
    };
    const result = await getDB().collection("products").insertOne(product);
    res.status(201).json({ ...product, _id: result.insertedId });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    if (!req.body || Array.isArray(req.body) || Object.keys(req.body).some(field => !["name", "price", "quantity", "category"].includes(field))) {
      return res.status(400).json({ error: "Invalid fields" });
    }
    if (!Object.keys(req.body).length) {
      return res.status(400).json({ error: "Provide fields to update" });
    }
    const id = new ObjectId(req.params.id);
    const result = await getDB().collection("products").updateOne(
      { _id: id },
      { $set: req.body }
    );
    if (!result.matchedCount) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json({ message: "Product updated" });
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
    const result = await getDB().collection("products").deleteOne({ _id: id });
    if (!result.deletedCount) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
