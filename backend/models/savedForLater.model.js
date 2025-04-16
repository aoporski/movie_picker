module.exports = (sequelize, DataTypes) => {
    const SavedForLater = sequelize.define("SavedForLater", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      movieId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    }, {
      tableName: "SavedForLater", 
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'movieId']
        }
      ] 
    });

    SavedForLater.associate = (models) => {
        SavedForLater.belongsTo(models.User, {
          foreignKey: 'userId',
          onDelete: 'CASCADE',
        });
      };
  
    return SavedForLater;
  };
  