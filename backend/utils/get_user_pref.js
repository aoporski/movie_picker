const { User } = require("../models");

const getUserPreferences = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ["favoriteActors", "favoriteDirectors", "favoriteGenres"],
    });

    if (!user) throw new Error("User not found");

    return {
      actors: user.favoriteActors || [],
      directors: user.favoriteDirectors || [],
      genres: user.favoriteGenres || [],
    };
  } catch (error) {
    throw new Error(`Error fetching user preferences: ${error.message}`);
  }
};

module.exports = { getUserPreferences };
