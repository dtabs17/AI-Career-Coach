require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const isProd = process.env.NODE_ENV === "production";
if (isProd) app.set("trust proxy", 1);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());


if (!isProd && process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
}

app.use("/api/auth", require("./routes/auth"));
app.use("/api/skills", require("./routes/skills"));
app.use("/api/user-skills", require("./routes/userSkills"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/recommendations", require("./routes/recommendations"));
app.use("/api/roles", require("./routes/roles"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/planner", require("./routes/planner"));
app.use("/api/interviews", require("./routes/interview"));


if (isProd) {
  const distPath = path.join(__dirname, "..", "..", "frontend", "dist");
  console.log("Serving frontend from:", distPath);
  app.use(express.static(distPath));


  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  const message =
    isProd ? "Server error" : (err.message || "Server error");
  res.status(500).json({ error: message });
});

const port = process.env.PORT || 3001;
app.listen(port);