"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    port: config.port || 5432,
    logging: false,
  });
}

fs.readdirSync(__dirname)
  .filter((file) => file !== basename && file.endsWith(".js"))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });


if (!db.User) {
  console.error("`User` model not loaded!");
} else {
  console.log("`User` model successfully loaded!");
}

if (!db.UserPreferences) {
  console.error("`UserPreferences` model not loaded!");
} else {
  console.log("`UserPreferences` model successfully loaded!");
}

if (!db.SavedForLater) {
  console.error("`SaveForLater` model not loaded!");
} else {
  console.log("'SaveForLater' model successfully loaded!");
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
