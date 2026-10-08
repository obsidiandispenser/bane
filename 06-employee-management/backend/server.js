const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");
const router = require("./routes/employees");

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/api/employees", router);

app.use((error, req, res, next) => {
  if (error.status === 400) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  console.error(error.message);
  res.status(500).json({ error: "Database error" });
});

async function start() {
  try {
    await connectDB();
    app.listen(3000, () => {
      console.log("Backend: http://localhost:3000");
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

start();
