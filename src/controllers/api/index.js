'use strict';

const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const api_controllers = {}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-18) === '.api.controller.js'
    );
  })
  .forEach(file => {
    const control_unit = require(path.join(__dirname, file));
    const name = file.slice(0, file.length - 18);
    api_controllers[name] = control_unit;
  });

module.exports = api_controllers;