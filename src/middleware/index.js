'use strict';

const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const middleware = {}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const control_unit = require(path.join(__dirname, file));
    const name = file.slice(0, file.length - 3);
    middleware[name] = control_unit;
  });

module.exports = middleware;