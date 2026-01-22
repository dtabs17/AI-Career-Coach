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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
