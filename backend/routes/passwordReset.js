const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User } = require("../models");
const sendVerificationEmail = require("../utils/send_mail");
const {
  isSafeStringArray,
  validateEmail,
  validatePassword,
} = require("../middleware/validateInput");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    const resetLink = `http://localhost:3001/reset-password?token=${token}`;

    await sendVerificationEmail(
      email,
      `Click here to reset your password: <a href="${resetLink}">Reset Password</a>`
    );

    res.json({ message: "Password reset email sent!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/reset", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ message: "Password must be 6–100 characters and safe." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
