const fetch = require("node-fetch");
const Redis = require("ioredis");
const redis = new Redis();
const db = require("../models");
const User = db.User;
const EXPANDED_ACTORS = require("./expanded_actors.js");
const EXPANDED_DIRECTORS = require("./expanded_directors.js");
const EXPANDED_GENRES = require("./expanded_genres");

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

const feedbackWeights = {
  liked: 1.0,
  this_one: 1.0,
  ok: 0.1,
  save_for_later: 0.8,
  disliked: -1.0,
  not_this_one: -0.6,
};

const getExpandedItems = (items, expansionMap) => {
  const expanded = new Set(items);
  items.forEach((item) => {
    if (expansionMap[item]) {
      expansionMap[item].forEach((related) => {
        expanded.add(related);
      });
    }
  });
  return Array.from(expanded);
};

const calculateScores = (feedbackList) => {
  const scores = { actors: {}, directors: {}, genres: {} };

  feedbackList.forEach(
    ({
      feedback,
      actors = [],
      directors = [],
      genres = [],
      persistent = false,
    }) => {
      const baseWeight = feedbackWeights[feedback] || 0;
      const weight = persistent ? baseWeight * 3.5 : baseWeight;

      actors.forEach(
        (a) => (scores.actors[a] = (scores.actors[a] || 0) + weight)
      );
      directors.forEach(
        (d) => (scores.directors[d] = (scores.directors[d] || 0) + weight)
      );
      genres.forEach(
        (g) => (scores.genres[g] = (scores.genres[g] || 0) + weight)
      );
    }
  );

  Object.keys(scores.genres).forEach((g) => (scores.genres[g] *= 1.4));
  Object.keys(scores.directors).forEach((d) => (scores.directors[d] *= 1.3));

  return scores;
};

const fetchWithRetry = async (url, retries = 2) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries > 0) return fetchWithRetry(url, retries - 1);
    console.error("Fetch failed:", url, error.message);
    return null;
  }
};

const TMDBHelper = {
  baseUrl: "https://api.themoviedb.org/3",
  apiKey: process.env.TMDB_API_KEY,

  async searchPerson(type, name) {
    const url = `${this.baseUrl}/search/person?api_key=${
      this.apiKey
    }&query=${encodeURIComponent(name)}`;
    const data = await fetchWithRetry(url);
    return data?.results?.[0];
  },

  async getMoviesByPerson(type, id, page) {
    const param = type === "actor" ? "with_cast" : "with_crew";
    const url = `${this.baseUrl}/discover/movie?api_key=${
      this.apiKey
    }&${param}=${id}&page=${page}&sort_by=${
      ["popularity.desc", "vote_average.desc", "release_date.desc"][
        Math.floor(Math.random() * 3)
      ]
    }`;
    return fetchWithRetry(url);
  },

  async getMoviesByGenre(genreId, page) {
    const url = `${this.baseUrl}/discover/movie?api_key=${
      this.apiKey
    }&with_genres=${genreId}&page=${page}&sort_by=${
      ["popularity.desc", "vote_average.desc", "revenue.desc"][
        Math.floor(Math.random() * 3)
      ]
    }`;
    return fetchWithRetry(url);
  },

  async getPopularMovies(page) {
    const url = `${this.baseUrl}/discover/movie?api_key=${this.apiKey}&sort_by=popularity.desc&page=${page}`;
    return fetchWithRetry(url);
  },

  async getGenreList() {
    const url = `${this.baseUrl}/genre/movie/list?api_key=${this.apiKey}`;
    return fetchWithRetry(url);
  },
};

const RecentMoviesManager = {
  async getRecentMovieIds(userId) {
    const recentRawIds = await redis.lrange(
      `user:${userId}:recent_movie_ids`,
      0,
      599
    );
    return new Set(recentRawIds.map(Number));
  },

  async updateRecentMovies(userId, newIds) {
    const uniqueNewIds = [...new Set(newIds)];
    if (newIds.length === 0) return;
    await redis
      .multi()
      .lpush(`user:${userId}:recent_movie_ids`, ...uniqueNewIds)
      .ltrim(`user:${userId}:recent_movie_ids`, 0, 699)
      .expire(`user:${userId}:recent_movie_ids`, 86400)
      .exec();
  },
};

const processMovieResults = (results, recentMovieIds) => {
  return shuffleArray(
    results
      .filter(
        (movie) =>
          movie.vote_average >= 6.5 &&
          movie.vote_count >= 950 &&
          !recentMovieIds.has(Number(movie.id))
      )
      .slice(0, 5)
  );
};

const addMoviesToMap = (movies, moviesMap, recentMovieIds, newMovieIds) => {
  const validMovies = processMovieResults(movies, recentMovieIds);
  for (const movie of validMovies) {
    if (!moviesMap.has(movie.id)) {
      moviesMap.set(movie.id, movie);
      newMovieIds.push(movie.id);
      recentMovieIds.add(movie.id);
      if (moviesMap.size >= 30) break;
    }
  }
};

const getPersistentFeedback = async (userId) => {
  if (userId.startsWith("guest_")) {
    try {
      const raw = await redis.lrange(`guest:${userId}:pref_init`, 0, 99);
      return raw.map((entry) => JSON.parse(entry));
    } catch (err) {
      console.error("Error fetching guest persistent feedback:", err);
      return [];
    }
  }

  try {
    const userPref = await User.findOne({ where: { id: userId } });
    if (!userPref) return [];

    const feedbackList = [];
    (userPref.favoriteActors || []).forEach((a) =>
      feedbackList.push({ feedback: "liked", actors: [a] })
    );
    (userPref.favoriteDirectors || []).forEach((d) =>
      feedbackList.push({ feedback: "liked", directors: [d] })
    );

    (userPref.favoriteGenres || []).forEach((g) =>
      feedbackList.push({ feedback: "liked", genres: [g] })
    );

    return feedbackList;
  } catch (error) {
    console.error("Error fetching persistent feedback:", error);
    return [];
  }
};

const getMovieRecommendations = async (userId, context = null) => {
  try {
    const feedbackList = await getFeedbackData(userId, context);
    if (feedbackList.length === 0) {
      console.warn("No feedback data found for user:", userId);
      return [];
    }

    const recentMovieIds = await RecentMoviesManager.getRecentMovieIds(userId);

    const moviesMap = new Map();
    const newMovieIds = [];

    const scores = calculateScores(feedbackList);
    const preferences = preparePreferences(scores);

    await fetchMoviesByPreferences(
      preferences,
      moviesMap,
      recentMovieIds,
      newMovieIds
    );

    await addRandomPopularMovies(moviesMap, recentMovieIds, newMovieIds);

    await RecentMoviesManager.updateRecentMovies(userId, newMovieIds);
    if (moviesMap.size < 10) {
      console.warn("Too few new movies – resetting recent_movie_ids");
      await redis.del(`user:${userId}:recent_movie_ids`);
      return await getMovieRecommendations(userId);
    }

    return shuffleArray(Array.from(moviesMap.values()));
  } catch (error) {
    console.error("Error in getMovieRecommendations:", error);
    return [];
  }
};

async function getFeedbackData(userId, context) {
  const persistent = await getPersistentFeedback(userId);

  if (context?.shortTerm?.length) {
    return [
      ...context.shortTerm,
      ...persistent.map((p) => ({ ...p, persistent: true })),
    ];
  }

  if (context?.longTerm) {
    const longTermFeedback = convertLongTermContext(context.longTerm);
    return [
      ...longTermFeedback,
      ...persistent.map((p) => ({ ...p, persistent: true })),
    ];
  }

  return persistent.map((p) => ({ ...p, persistent: true }));
}

function convertLongTermContext(longTerm) {
  const feedback = [];
  Object.keys(longTerm.actors || {}).forEach((a) =>
    feedback.push({ feedback: "liked", actors: [a] })
  );
  Object.keys(longTerm.directors || {}).forEach((d) =>
    feedback.push({ feedback: "liked", directors: [d] })
  );
  Object.keys(longTerm.genres || {}).forEach((g) =>
    feedback.push({ feedback: "liked", genres: [g] })
  );
  return feedback;
}

function preparePreferences(scores) {
  const calculateWeight = (baseScore, type) => {
    const typeMultipliers = { actor: 1.1, director: 1.3, genre: 1.4 };
    const randomVariance = 0.2 + Math.random() * 0.3;
    return baseScore * typeMultipliers[type] * randomVariance;
  };

  const generateCategoryPreferences = (category, expansionMap, type) => {
    return Object.entries(scores[category])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .flatMap(([name, score]) =>
        getExpandedItems([name], expansionMap).map((expandedName) => ({
          type,
          name: expandedName,
          weight: calculateWeight(score, type),
        }))
      )
      .filter((v, i, a) => a.findIndex((t) => t.name === v.name) === i);
  };

  const preferences = [
    ...generateCategoryPreferences("actors", EXPANDED_ACTORS, "actor"),
    ...generateCategoryPreferences("directors", EXPANDED_DIRECTORS, "director"),
    ...generateCategoryPreferences("genres", EXPANDED_GENRES, "genre"),
  ];

  return shuffleArray(shuffleArray(preferences).slice(0, 30))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 15);
}

async function fetchMoviesByPreferences(
  preferences,
  moviesMap,
  recentMovieIds,
  newMovieIds
) {
  const fetchPromises = preferences.map((pref) =>
    fetchMoviesForPreference(pref)
  );
  const results = await Promise.all(fetchPromises);

  results.forEach((movies, index) => {
    addMoviesToMap(movies, moviesMap, recentMovieIds, newMovieIds);
    if (index % 3 === 0) {
      addRandomPopularMovies(moviesMap, recentMovieIds, newMovieIds);
    }
  });
}

async function fetchMoviesForPreference(pref) {
  try {
    switch (pref.type) {
      case "actor":
      case "director":
        const person = await TMDBHelper.searchPerson(pref.type, pref.name);
        if (!person || person.name !== pref.name) return [];
        const personMovies = await TMDBHelper.getMoviesByPerson(
          pref.type,
          person.id,
          getRandomPage()
        );
        return (personMovies?.results || []).map((movie) => ({
          ...movie,
          _sortScore: Math.random(),
        }));

      case "genre":
        const genreId = await getGenreId(pref.name);
        if (!genreId) return [];
        const genreMovies = await TMDBHelper.getMoviesByGenre(
          genreId,
          getRandomPage()
        );
        return (genreMovies?.results || []).map((movie) => ({
          ...movie,
          _sortScore: Math.random(),
        }));

      default:
        return [];
    }
  } catch (error) {
    console.error("Error fetching movies for preference:", pref, error);
    return [];
  }
}

async function addRandomPopularMovies(moviesMap, recentMovieIds, newMovieIds) {
  const randomPage = Math.floor(Math.random() * 10) + 1;
  const data = await TMDBHelper.getPopularMovies(randomPage);
  const movies = processMovieResults(data?.results || [], recentMovieIds);

  for (const movie of movies) {
    if (moviesMap.size >= 30) break;
    if (!moviesMap.has(movie.id)) {
      moviesMap.set(movie.id, movie);
      newMovieIds.push(movie.id);
      recentMovieIds.add(movie.id);
    }
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getRandomPage() {
  return Math.floor(Math.random() * 5) + 1;
}

async function getGenreId(genreName) {
  try {
    const data = await TMDBHelper.getGenreList();
    if (!data?.genres) return null;
    return data.genres.find(
      (g) => g.name.toLowerCase() === genreName.toLowerCase()
    )?.id;
  } catch (error) {
    console.error("Error getting genre ID:", error);
    return null;
  }
}

module.exports = { getMovieRecommendations };
