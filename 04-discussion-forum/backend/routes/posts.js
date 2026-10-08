const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db");
const router = express.Router();
router.param("id", (req, res, next, id) => {
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid post ID" });
  req.postId = new ObjectId(id); next();
});
function validate(body, creating) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Body must be an object";
  if (!Object.keys(body).length || Object.keys(body).some(key => !["title", "content", "author"].includes(key))) return "Only title, content, and author are accepted";
  if ((creating || body.title !== undefined) && (typeof body.title !== "string" || !body.title.trim())) return "Title is required";
  if ((creating || body.content !== undefined) && (typeof body.content !== "string" || !body.content.trim())) return "Content is required";
  if ((creating || body.author !== undefined) && (typeof body.author !== "string" || !body.author.trim())) return "Author is required";
  return null;
}
router.get("/", async (req, res) => {
  try { res.json(await getDB().collection("posts").find().toArray()); }
  catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.get("/:id", async (req, res) => {
  try {
    const post = await getDB().collection("posts").findOne({ _id: req.postId });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.post("/", async (req, res) => {
  const error = validate(req.body, true);
  if (error) return res.status(400).json({ error });
  try {
    const post = { title: req.body.title, content: req.body.content, author: req.body.author, comments: [] };
    const result = await getDB().collection("posts").insertOne(post);
    res.status(201).json({ ...post, _id: result.insertedId });
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.patch("/:id", async (req, res) => {
  const error = validate(req.body, false);
  if (error) return res.status(400).json({ error });
  try {
    const posts = getDB().collection("posts");
    const result = await posts.updateOne({ _id: req.postId }, { $set: req.body });
    if (!result.matchedCount) return res.status(404).json({ error: "Post not found" });
    const post = await posts.findOne({ _id: req.postId });
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.delete("/:id", async (req, res) => {
  try {
    // Comments live inside the post and are removed together with it.
    const result = await getDB().collection("posts").deleteOne({ _id: req.postId });
    if (!result.deletedCount) return res.status(404).json({ error: "Post not found" });
    res.status(204).send();
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
router.post("/:id/comments", async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(key => !["author", "text"].includes(key)) ||
      typeof body.author !== "string" || !body.author.trim() || typeof body.text !== "string" || !body.text.trim()) {
    return res.status(400).json({ error: "Comment author and text are required" });
  }
  try {
    const comment = { _id: new ObjectId(), author: body.author, text: body.text };
    // $push appends atomically, so concurrent comments do not overwrite one another.
    const result = await getDB().collection("posts").updateOne({ _id: req.postId }, { $push: { comments: comment } });
    if (!result.matchedCount) return res.status(404).json({ error: "Post not found" });
    res.status(201).json(comment);
  } catch (error) { console.error(error); res.status(500).json({ error: "Database error" }); }
});
module.exports = router;
