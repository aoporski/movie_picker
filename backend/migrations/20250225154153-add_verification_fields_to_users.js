module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Users", "verificationCode", {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("Users", "isVerified", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Users", "verificationCode");
    await queryInterface.removeColumn("Users", "isVerified");
  },
};
