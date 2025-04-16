const express = require("express");
const { getUserPreferences } = require("../utils/get_user_pref");
const User = require("../models").User;
const router = express.Router();

router.get("/preferences", async (req, res) => {
  try {
    const { userId } = req.query;
    const preferences = await getUserPreferences(userId);
    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/preferences", async (req, res) => {
  const { userId, favoriteActors, favoriteDirectors, favoriteGenres } =
    req.body;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId" });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update({
      favoriteActors: favoriteActors || user.favoriteActors,
      favoriteDirectors: favoriteDirectors || user.favoriteDirectors,
      favoriteGenres: favoriteGenres || user.favoriteGenres,
    });

    res.status(200).json({ message: "Preferences updated successfully", user });
  } catch (err) {
    console.error("❌ Error updating preferences:", err);
    res.status(500).json({ message: "Failed to update preferences" });
  }
});

module.exports = router;
