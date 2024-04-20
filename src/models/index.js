'use strict';
const env = process.env.NODE_ENV || 'development';
const logger = require('../config/logger.config').child({"process": "model_creation"});
const config = require('./../config/db.config')[env];

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

async function connect() {
  try {
    await sequelize.authenticate();
    logger.info("Connected to database successfully");
  }
  catch (err) {
    logger.error("Couldn't connect to database");
    throw "Couldn't connect to database";
  }
}

connect();

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-9) === '.model.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file)).model(sequelize, Sequelize.DataTypes);
    logger.info(`Detected ${model.name} model`);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
