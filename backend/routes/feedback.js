const express = require("express");

const Redis = require("ioredis");
const redis = new Redis();
const {
  adjustPreferencesBasedOnFeedback,
} = require("../utils/decision_feedback");
const { getMovieRecommendations } = require("../utils/decision");

const router = express.Router();

const UserPreferences = require("../models").UserPreferences;
const SavedForLater = require("../models").SavedForLater;

const COMMIT_THRESHOLD = 2;

router.post("/", async (req, res) => {
  const { userId, movieId, feedback, movieDetails } = req.body;

  if (!userId || !movieId || !feedback || !movieDetails) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const key = `user:${userId}:feedback`;
  const countKey = `user:${userId}:feedbackCount`;

  const feedbackEntry = {
    feedback,
    movieId,
    actors: movieDetails.actors.slice(0, 5) || [],
    directors: movieDetails.directors || [],
    genres: movieDetails.genres || [],
    timestamp: new Date().toISOString(),
  };

  console.log("Feedback entry:", feedbackEntry);
  console.log("Feedback:", feedback);
  if (feedback === "save_for_later") {
    await SavedForLater.upsert({
      userId: userId,
      movieId: movieId,
    });
  }

  try {
    await redis.lpush(key, JSON.stringify(feedbackEntry));
    await redis.ltrim(key, 0, 99);
    const newCount = await redis.incr(countKey);

    if (newCount % COMMIT_THRESHOLD === 0) {
      const history = await redis.lrange(key, 0, 99);
      const parsed = history.map(JSON.parse);

      const actorScores = {};
      const directorScores = {};
      const genreScores = {};

      parsed.forEach((item, index) => {
        const ageWeight = Math.pow(0.9, index);
        const scalePreferences = (prefs, weight) =>
          Object.fromEntries(
            Object.entries(prefs).map(([key, value]) => [key, value * weight])
          );

        const rawAdjustment = adjustPreferencesBasedOnFeedback(item.feedback, {
          actors: item.actors,
          directors: item.directors,
          genres: item.genres,
        });

        const adjustment = {
          actors: scalePreferences(rawAdjustment.actors, ageWeight),
          directors: scalePreferences(rawAdjustment.directors, ageWeight),
          genres: scalePreferences(rawAdjustment.genres, ageWeight),
        };

        for (const actor in adjustment.actors) {
          actorScores[actor] =
            (actorScores[actor] || 0) + adjustment.actors[actor];
        }
        for (const director in adjustment.directors) {
          directorScores[director] =
            (directorScores[director] || 0) + adjustment.directors[director];
        }
        for (const genre in adjustment.genres) {
          genreScores[genre] =
            (genreScores[genre] || 0) + adjustment.genres[genre];
        }
      });

      const userExists = await require("../models").User.findByPk(userId);
      if (!userExists) {
        console.error(
          "Użytkownik nie istnieje w bazie. Nie zapisuję preferencji."
        );
        return res.status(404).json({ message: "User not found" });
      }

      try {
        const [userPrefs, created] = await UserPreferences.findOrCreate({
          where: { userId },
          defaults: {
            preferences: {
              actors: {},
              directors: {},
              genres: {},
            },
          },
        });

        const existingPrefs = userPrefs.preferences;

        const roundPreferences = (prefs, decimals = 2) =>
          Object.fromEntries(
            Object.entries(prefs).map(([key, value]) => [
              key,
              Number(value.toFixed(decimals)),
            ])
          );

        const cleanupPreferences = (prefs, threshold = 0.01) =>
          Object.fromEntries(
            Object.entries(prefs).filter(
              ([_, value]) => Math.abs(value) >= threshold
            )
          );

        const limitPreferences = (prefs, max = 20) =>
          Object.fromEntries(
            Object.entries(prefs)
              .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
              .slice(0, max)
          );

        const mergeAndClean = (existing, scores) =>
          limitPreferences(
            roundPreferences(cleanupPreferences({ ...existing, ...scores })),
            20
          );

        const cleanedAndLimitedPrefs = {
          actors: mergeAndClean(existingPrefs.actors || {}, actorScores),
          directors: mergeAndClean(
            existingPrefs.directors || {},
            directorScores
          ),
          genres: mergeAndClean(existingPrefs.genres || {}, genreScores),
        };
        console.log(cleanedAndLimitedPrefs);
        await UserPreferences.update(
          { preferences: cleanedAndLimitedPrefs },
          { where: { userId } }
        );

        await redis.del(`recs:${userId}`);
        console.log("UserPreferences zapisane.");

        const recommendations = await getMovieRecommendations(userId);
        return res.status(200).json({
          message: "Feedback stored and preferences updated.",
          recommendations,
        });
      } catch (err) {
        console.error("Error during upsert:", err);
        return res.status(500).json({ message: "Error updating preferences." });
      }
    }
    res.status(200).json({ message: "Feedback stored in Redis" });
  } catch (error) {
    console.error("Redis error:", error);
    res.status(500).json({ message: "Error storing feedback." });
  }
});

router.get("/test-create", async (req, res) => {
  try {
    const testUserId = "e8af28b3-ad37-4ceb-b7d2-591bf479d7a0";
    const UserPreferences = require("../models").UserPreferences;
    console.log("Column types of UserPreferences:");
    console.log(UserPreferences.rawAttributes);
    await UserPreferences.upsert({
      userId: testUserId,
      preferences: {
        actors: { "Tom Hanks": 1 },
        genres: { Comedy: 1 },
        directors: { Spielberg: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    res.json({ message: "Manually added preferences" });
  } catch (err) {
    console.error("Error during manual create:", err.message, err.stack);
    res.status(500).json({ error: "Manual create didn't work" });
  }
});
module.exports = router;
