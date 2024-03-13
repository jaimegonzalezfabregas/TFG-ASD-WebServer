require('dotenv').config();

module.exports = {
    dev: {
        dialect: process.env.DB_DIALECT,
        host: process.env.DB_DEV_HOST,
        port: process.env.DB_DEV_PORT,
        database: process.env.DB_DEV_NAME,
        username: process.env.DB_DEV_USER,
        password: process.env.DB_DEV_PASS,
        dialectOptions: {
            dateStrings: true, // Pasar fechas a strings (para ignorar la zona horaria)
            typeCast: function (field, next) {
              if (field.type === 'DATETIME') {
                return field.string();
              }
              return next();
            },
        },
        timezone: process.env.DB_TIMEZONE
    },
    test: {
        dialect: process.env.DB_DIALECT,
        host: process.env.DB_TEST_HOST,
        port: process.env.DB_TEST_PORT,
        database: process.env.DB_TEST_NAME,
        username: process.env.DB_TES_USER,
        password: process.env.DB_TEST_PASS,
        dialectOptions: {
            dateStrings: true, // Pasar fechas a strings (para ignorar la zona horaria)
            typeCast: function (field, next) {
              if (field.type === 'DATETIME') {
                return field.string();
              }
              return next();
            },
        },
        timezone: process.env.DB_TIMEZONE
    },
    prod: {
        dialect: process.env.DB_DIALECT,
        host: process.env.DB_PROD_HOST,
        port: process.env.DB_PROD_PORT,
        database: process.env.DB_PROD_NAME,
        username: process.env.DB_PROD_USER,
        password: process.env.DB_PROD_PASS,
        dialectOptions: {
            dateStrings: true, // Pasar fechas a strings (para ignorar la zona horaria)
            typeCast: function (field, next) {
              if (field.type === 'DATETIME') {
                return field.string();
              }
              return next();
            },
        },
        timezone: process.env.DB_TIMEZONE
    }
}

