module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    surname: {
      type: DataTypes.STRING,
      allowNull: false,
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
    country: {
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
  });

  return User;
};
