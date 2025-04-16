const express = require("express");
const Redis = require("ioredis");
const redis = new Redis();
const { getMovieRecommendations } = require("../utils/decision");
const router = express.Router();
const db = require("../models");
const UserPreferences = db.UserPreferences;
const SavedForLater = db.SavedForLater;

const generateRecommendations = async (userId, context) => {
  try {
    const personalized = await getMovieRecommendations(userId, context);

    if (personalized.length < 10) {
      const fallback = await getFallbackRecommendations(userId);
      return [...personalized, ...fallback];
    }

    return personalized;
  } catch (error) {
    return await getFallbackRecommendations(userId);
  }
};
const getEnhancedContext = async (userId) => {
  const [redisFeedback, dbPreferences, savedMovies] = await Promise.all([
    redis.lrange(`user:${userId}:feedback`, 0, 99),
    UserPreferences.findOne({ where: { userId } }),
    SavedForLater.findAll({ where: { userId } }),
  ]);

  return {
    shortTerm: redisFeedback.map(JSON.parse),
    longTerm: dbPreferences?.preferences || {},
    saved: savedMovies.map((m) => m.movieId),
  };
};

const getFallbackRecommendations = async (userId) => {
  const globalTrending = await redis.zrevrange("global:trending", 0, 50);
  const userSeen = await redis.zrange(`user:${userId}:history`, 0, -1);

  return globalTrending
    .filter((movieId) => !userSeen.includes(movieId))
    .slice(0, 20);
};

router.get("/", async (req, res) => {
  const userId = req.query.userId;
  const guestId = req.headers["x-guest-id"];

  if (!userId && !guestId) {
    return res.status(400).json({
      code: "MISSING_ID",
      message: "Provide userId query param or x-guest-id header",
    });
  }

  const isGuest = !!guestId;
  const cacheKey = isGuest ? `recs:guest:${guestId}` : `recs:${userId}`;
  const feedbackKey = isGuest
    ? `guest:${guestId}:feedback`
    : `user:${userId}:feedback`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const context = isGuest
      ? {
          shortTerm: (await redis.lrange(feedbackKey, 0, 99)).map(JSON.parse),
          longTerm: {},
          saved: [],
        }
      : await getEnhancedContext(userId);

    const uid = userId || guestId;
    const recommendations = await generateRecommendations(uid, context);
    await redis.setex(cacheKey, 300, JSON.stringify(recommendations));

    if (recommendations.length === 0) {
      return res.status(503).json({
        code: "NO_RECOMMENDATIONS",
        message: "Could not generate recommendations",
        fallback: await getFallbackRecommendations(userId),
      });
    }

    return res.json(recommendations);
  } catch (error) {
    console.error(`[Recs] Error for ${userId || guestId}:`, error);
    const fallback = await getFallbackRecommendations(userId);
    return res.status(200).json({
      code: "FALLBACK_USED",
      recommendations: fallback,
    });
  }
});

module.exports = router;
