const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://localhost:27017", { serverSelectionTimeoutMS: 5000 });
let db;
async function connectDB() {
  await client.connect();
  db = client.db("student_performance_db");
  return db;
}
function getDB() {
  if (!db) {
    throw new Error("MongoDB is not connected");
  }
  return db;
}
module.exports = { connectDB, getDB };
