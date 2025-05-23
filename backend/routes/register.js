require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const db = require("../models");
const sendVerificationEmail = require("../utils/send_mail");
const User = db.User;

const {
  isSafeStringArray,
  validateEmail,
  validatePassword,
} = require("../middleware/validateInput");

router.post("/", async (req, res) => {
  try {
    const {
      email,
      password,
      favoriteDirectors,
      favoriteActors,
      favoriteGenres,
    } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ message: "Password must be 6–100 characters and safe." });
    }

    if (
      !isSafeStringArray(favoriteDirectors) ||
      !isSafeStringArray(favoriteActors) ||
      !isSafeStringArray(favoriteGenres)
    ) {
      return res.status(400).json({ message: "Invalid data in preferences." });
    }
    if (
      favoriteActors?.length > 33 ||
      favoriteDirectors?.length > 22 ||
      favoriteGenres?.length > 12
    ) {
      return res.status(400).json({ message: "Too many preferences." });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 899999).toString();

    const user = await User.create({
      email,
      password: hashedPassword,
      favoriteDirectors: Array.isArray(favoriteDirectors)
        ? favoriteDirectors
        : [],
      favoriteActors: Array.isArray(favoriteActors) ? favoriteActors : [],
      favoriteGenres: Array.isArray(favoriteGenres) ? favoriteGenres : [],
      isVerified: false,
      verificationCode: code,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await sendVerificationEmail(user.email, code);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        favoriteDirectors: user.favoriteDirectors,
        favoriteActors: user.favoriteActors,
        favoriteGenres: user.favoriteGenres,
        isVerified: user.isVerified,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required" });
    }

    const user = await User.findOne({ where: { email, verificationCode } });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    user.isVerified = true;
    await user.save();

    res
      .status(200)
      .json({ message: "Account verified successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified." });
    }

    await sendVerificationEmail(user.email, user.verificationCode);

    res.status(200).json({ message: "Verification code sent successfully." });
  } catch (error) {
    console.error("Error resending verification code:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
