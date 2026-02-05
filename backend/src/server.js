require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));


app.use("/api/auth", require("./routes/auth"));
app.use("/api/skills", require("./routes/skills"));
app.use("/api/user-skills", require("./routes/userSkills"));
app.use("/api/profile", require("./routes/profile"));

app.use("/api/recommendations", require("./routes/recommendations"));
app.use("/api/roles", require("./routes/roles"));

app.use("/api/chat", require("./routes/chat"));
app.use("/api/planner", require("./routes/planner"));


app.use((err, req, res, next) => {
  console.error(err);
  const message = process.env.NODE_ENV === "production" ? "Server error" : (err.message || "Server error");
  res.status(500).json({ error: message });
});


const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
