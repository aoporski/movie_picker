const express = require("express");
const router = express.Router();
const { SavedForLater } = require("../models");

router.get("/", async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId in query params" });
  }

  try {
    const saved = await SavedForLater.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.json(saved);
  } catch (error) {
    console.error("Error fetching saved movies:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/", async (req, res) => {
    const { userId, movieId } = req.body;
    
    if (!userId || !movieId) {
        return res.status(400).json({ error: "Missing userId or movieId in request body" });
    }
    
    try {
        await SavedForLater.destroy({
        where: { userId, movieId },
        });
    
        res.json({ message: "Movie removed from saved for later" });
    } catch (error) {
        console.error("Error removing saved movie:", error);
        res.status(500).json({ error: "Internal server error" });
    }


})

module.exports = router;