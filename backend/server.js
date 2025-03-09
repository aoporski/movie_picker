const express = require("express");
const registerRoutes = require("./routes/register.js");
const loginRoutes = require("./routes/login.js");
const helmet = require("helmet");
const cors = require("cors");
const db = require("./models");
const rateLimit = require("express-rate-limit");
const resetPasswordRoutes = require("./routes/passwordReset.js");

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again later.",
});

app.use("/api/login", loginLimiter);
app.use("/api/login", loginRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/password-reset", resetPasswordRoutes);

const PORT = process.env.PORT || 3000;
console.log("📌 Loaded routes:");
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`   - ${r.route.path}`);
  }
});
const startServer = async () => {
  try {
    await db.sequelize.sync();
    console.log("Database connected and synced successfully.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
};

startServer();
