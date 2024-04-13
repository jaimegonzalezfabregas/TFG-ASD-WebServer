require('dotenv').config();

module.exports = {
    development: {
        dialect: (process.env.DB_DIALECT) ? process.env.DB_DIALECT : 'mysql',
        host: (process.env.DB_DEV_HOST) ? process.env.DB_DEV_HOST : `localhost:${(process.env.DB_DEV_PORT) ? process.env.DB_DEV_PORT : 3306}`,
        port: (process.env.DB_DEV_PORT) ? process.env.DB_DEV_PORT : 3306,
        database: (process.env.DB_DEV_NAME) ? process.env.DB_DEV_NAME : "ASD_development_database",
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
        timezone: "+00:00"
    },
    test: {
      dialect: (process.env.DB_DIALECT) ? process.env.DB_DIALECT : 'mysql',
      host: (process.env.DB_TEST_HOST) ? process.env.DB_TEST_HOST : `localhost:${(process.env.DB_TEST_PORT) ? process.env.DB_TEST_PORT : 3306}`,
      port: (process.env.DB_TEST_PORT) ? process.env.DB_TEST_PORT : 3306,
      database: (process.env.DB_TEST_NAME) ? process.env.DB_TEST_NAME : "ASD_test_database",
        username: process.env.DB_TEST_USER,
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
        timezone: "+00:00"
    },
    production: {
        dialect: (process.env.DB_DIALECT) ? process.env.DB_DIALECT : 'mysql',
        host: (process.env.DB_PROD_HOST) ? process.env.DB_PROD_HOST : `localhost:${(process.env.DB_PROD_PORT) ? process.env.DB_PROD_PORT : 3306}`,
        port: (process.env.DB_PROD_PORT) ? process.env.DB_PROD_PORT : 3306,
        database: (process.env.DB_PROD_NAME) ? process.env.DB_PROD_NAME : "ASD_production_database",
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
        timezone: "+00:00",
        logging: false
    }
}

