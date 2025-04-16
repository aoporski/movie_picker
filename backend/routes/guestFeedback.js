const express = require("express");
const Redis = require("ioredis");
const redis = new Redis();
const router = express.Router();

router.post("/", async (req, res) => {
  const guestId = req.headers["x-guest-id"];
  const { movieId, feedback, movieDetails } = req.body;

  if (!guestId || !movieId || !feedback || !movieDetails) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const key = `guest:${guestId}:feedback`;

  const feedbackEntry = {
    feedback,
    movieId,
    actors: movieDetails.actors.slice(0, 5) || [],
    directors: movieDetails.directors || [],
    genres: movieDetails.genres || [],
    timestamp: new Date().toISOString(),
  };

  try {
    await redis
      .multi()
      .lpush(key, JSON.stringify(feedbackEntry))
      .ltrim(key, 0, 99)
      .expire(key, 1800)
      .exec();

    const { getMovieRecommendations } = require("../utils/decision");
    const shortTerm = (await redis.lrange(key, 0, 99)).map(JSON.parse);

    const context = {
      shortTerm,
      longTerm: {},
      saved: [],
    };

    const recommendations = await getMovieRecommendations(guestId, context);
    await redis.setex(
      `recs:guest:${guestId}`,
      300,
      JSON.stringify(recommendations)
    );

    res.status(200).json({ message: "Guest feedback stored", recommendations });
  } catch (err) {
    console.error("Redis guest feedback error:", err);
    res.status(500).json({ message: "Failed to store guest feedback" });
  }
});

module.exports = router;
