module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Users", "favoriteDirectors", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
    });
    await queryInterface.addColumn("Users", "favoriteActors", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
    });
    await queryInterface.addColumn("Users", "favoriteGenres", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Users", "favoriteDirectors");
    await queryInterface.removeColumn("Users", "favoriteActors");
    await queryInterface.removeColumn("Users", "favoriteGenres");
  },
};
