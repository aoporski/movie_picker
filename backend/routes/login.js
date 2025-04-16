require("dotenv").config();
const express = require("express");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.User;
const Redis = require("ioredis");
const redis = new Redis();
const {
  validateEmail,
  validatePassword,
} = require("../middleware/validateInput");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ message: "Password must be 6–100 characters and safe." });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message:
          "Account not verified. Please check your email for the verification code.",
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const redisKey = `user:${user.id}:feedback`;
    const exists = await redis.exists(redisKey);

    if (!exists) {
      const preferences =
        user.favoriteActors.length ||
        user.favoriteDirectors.length ||
        user.favoriteGenres.length;

      if (preferences) {
        const starterFeedback = {
          feedback: "liked",
          movieId: null,
          actors: user.favoriteActors || [],
          directors: user.favoriteDirectors || [],
          genres: user.favoriteGenres || [],
          timestamp: new Date().toISOString(),
        };

        await redis.lpush(redisKey, JSON.stringify(starterFeedback));
      }
    }

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
