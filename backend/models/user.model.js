module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      favoriteDirectors: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      favoriteActors: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      favoriteGenres: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      verificationCode: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: "Users",
    }
  );
  User.associate = function (models) {
    User.hasOne(models.UserPreferences, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    User.hasMany(models.SavedForLater, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
  };

  return User;
};
