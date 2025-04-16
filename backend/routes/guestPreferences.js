const express = require("express");
const router = express.Router();
const Redis = require("ioredis");
const redis = new Redis();

router.post("/", async (req, res) => {
  const { guestId, favoriteActors, favoriteDirectors, favoriteGenres } =
    req.body;
  if (!guestId) return res.status(400).json({ message: "Missing guestId" });

  const feedbackEntries = [];

  (favoriteActors || []).forEach((a) =>
    feedbackEntries.push({
      feedback: "liked",
      movieId: null,
      actors: [a],
      directors: [],
      genres: [],
      timestamp: new Date().toISOString(),
    })
  );
  (favoriteDirectors || []).forEach((d) =>
    feedbackEntries.push({
      feedback: "liked",
      movieId: null,
      actors: [],
      directors: [d],
      genres: [],
      timestamp: new Date().toISOString(),
    })
  );
  (favoriteGenres || []).forEach((g) =>
    feedbackEntries.push({
      feedback: "liked",
      movieId: null,
      actors: [],
      directors: [],
      genres: [g],
      timestamp: new Date().toISOString(),
    })
  );

  try {
    const key = `guest:${guestId}:pref_init`;
    await redis.del(key);
    const pipeline = redis.pipeline();
    feedbackEntries.forEach((entry) =>
      pipeline.lpush(key, JSON.stringify(entry))
    );
    pipeline.ltrim(key, 0, 99);
    pipeline.expire(key, 1800);
    await pipeline.exec();

    const { getMovieRecommendations } = require("../utils/decision");
    const context = {
      shortTerm: [],
      longTerm: {},
      saved: [],
    };

    const recommendations = await getMovieRecommendations(guestId, context);
    await redis.setex(
      `recs:guest:${guestId}`,
      300,
      JSON.stringify(recommendations)
    );

    res.status(200).json({ message: "Guest preferences saved." });
  } catch (err) {
    console.error("Error saving guest preferences:", err);
    res.status(500).json({ message: "Internal error." });
  }
});

router.put("/", async (req, res) => {
  const { guestId, favoriteActors, favoriteDirectors, favoriteGenres } =
    req.body;
  if (!guestId) return res.status(400).json({ message: "Missing guestId" });

  const key = `guest:${guestId}:pref_init`;

  const newEntries = [];

  (favoriteActors || []).forEach((a) =>
    newEntries.push({
      feedback: "liked",
      movieId: null,
      actors: [a],
      directors: [],
      genres: [],
      timestamp: new Date().toISOString(),
    })
  );
  (favoriteDirectors || []).forEach((d) =>
    newEntries.push({
      feedback: "liked",
      movieId: null,
      actors: [],
      directors: [d],
      genres: [],
      timestamp: new Date().toISOString(),
    })
  );
  (favoriteGenres || []).forEach((g) =>
    newEntries.push({
      feedback: "liked",
      movieId: null,
      actors: [],
      directors: [],
      genres: [g],
      timestamp: new Date().toISOString(),
    })
  );

  try {
    await redis.del(key);
    const pipeline = redis.pipeline();
    newEntries.forEach((entry) => pipeline.lpush(key, JSON.stringify(entry)));
    pipeline.ltrim(key, 0, 99);
    pipeline.expire(key, 1800);
    await pipeline.exec();

    const { getMovieRecommendations } = require("../utils/decision");
    const context = {
      shortTerm: [],
      longTerm: {},
      saved: [],
    };
    const newRecs = await getMovieRecommendations(guestId, context);
    await redis.setex(`recs:guest:${guestId}`, 300, JSON.stringify(newRecs));

    res.status(200).json({ message: "Guest preferences updated." });
  } catch (err) {
    console.error("Redis update error:", err);
    res.status(500).json({ message: "Error updating preferences." });
  }
});

router.get("/has", async (req, res) => {
  const { guestId } = req.query;
  if (!guestId) return res.status(400).json({ message: "Missing guestId" });

  try {
    const exists = await redis.exists(`guest:${guestId}:pref_init`);
    res.json({ hasPreferences: exists === 1 });
  } catch (err) {
    console.error("Redis check error:", err);
    res.status(500).json({ message: "Error checking preferences" });
  }
});

router.get("/preferences", async (req, res) => {
  const { guestId } = req.query;
  if (!guestId) return res.status(400).json({ message: "Missing guestId" });

  try {
    const raw = await redis.lrange(`guest:${guestId}:pref_init`, 0, 99);
    const parsed = raw.map(JSON.parse);

    const actors = new Set();
    const directors = new Set();
    const genres = new Set();

    parsed.forEach((entry) => {
      entry.actors?.forEach((a) => actors.add(a));
      entry.directors?.forEach((d) => directors.add(d));
      entry.genres?.forEach((g) => genres.add(g));
    });

    res.json({
      actors: Array.from(actors),
      directors: Array.from(directors),
      genres: Array.from(genres),
    });
  } catch (err) {
    console.error("Error fetching guest preferences:", err);
    res.status(500).json({ message: "Error" });
  }
});

module.exports = router;
