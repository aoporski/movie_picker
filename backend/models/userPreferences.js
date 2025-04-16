module.exports = (sequelize, DataTypes) => {
  const UserPreferences = sequelize.define("UserPreferences", {
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  });

  UserPreferences.associate = (models) => {
    UserPreferences.belongsTo(models.User, { foreignKey: "userId", onDelete: "CASCADE" });
  };

  return UserPreferences;
};
