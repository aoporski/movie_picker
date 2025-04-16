const express = require("express");
const registerRoutes = require("./routes/register.js");
const loginRoutes = require("./routes/login.js");
const helmet = require("helmet");
const cors = require("cors");
const db = require("./models");
const rateLimit = require("express-rate-limit");

const resetPasswordRoutes = require("./routes/passwordReset.js");
const registerPrefRoutes = require("./routes/register_pref.js");
const decisionRoutes = require("./routes/decision.js");
const feedbackRoutes = require("./routes/feedback.js");
const savedForLaterRoutes = require("./routes/saved_for_later.js");
const guestPrefRoutes = require("./routes/guestPreferences.js");
const guestFeedbackRoutes = require("./routes/guestFeedback");

const app = express();

const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 400,
  message: "Too many requests. Please try again later.",
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again later.",
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many register attempts. Please try again later.",
});

const guestFeedbackLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 250,
  message: "Too many guest feedbacks.",
});

const feedbackLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 250,
  message: "Too many feedbacks.",
});

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(generalLimiter);

app.use("/api/login", loginLimiter, loginRoutes);
app.use("/api/register", registerLimiter, registerRoutes);
app.use("/api/password-reset", resetPasswordRoutes);
app.use("/api/register-pref", registerPrefRoutes);
app.use("/api/decision", decisionRoutes);
app.use("/api/feedback", feedbackLimiter, feedbackRoutes);
app.use("/api/saved", savedForLaterRoutes);
app.use("/api/guest-pref", guestPrefRoutes);
app.use("/api/guest-feedback", guestFeedbackLimiter, guestFeedbackRoutes);
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await db.sequelize.sync({ alter: true });
    console.log("Database connected and synced successfully.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
};

startServer();
