const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const posts = await getDB().collection("posts").find().toArray();
    res.json(posts);
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
    const post = await getDB().collection("posts").findOne({ _id: id });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { title, content, author } = req.body;
    if (!title || !content || !author) {
      return res.status(400).json({ error: "Enter a title, content, and author" });
    }
    const post = { title, content, author, comments: [] };
    const result = await getDB().collection("posts").insertOne(post);
    res.status(201).json({ ...post, _id: result.insertedId });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    if (!req.body || !Object.keys(req.body).length || Object.keys(req.body).some(field => !["title", "content", "author"].includes(field))) {
      return res.status(400).json({ error: "Only title, content, and author can be updated" });
    }
    const id = new ObjectId(req.params.id);
    const result = await getDB().collection("posts").updateOne({ _id: id }, { $set: req.body });
    if (!result.matchedCount) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json({ message: "Post updated" });
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
    const result = await getDB().collection("posts").deleteOne({ _id: id });
    if (!result.deletedCount) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/comments", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    const { author, text } = req.body;
    if (typeof author !== "string" || !author.trim() || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Enter your name and comment" });
    }
    const id = new ObjectId(req.params.id);
    const comment = { _id: new ObjectId(), author, text };
    const result = await getDB().collection("posts").updateOne(
      { _id: id },
      { $push: { comments: comment } }
    );
    if (!result.matchedCount) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
