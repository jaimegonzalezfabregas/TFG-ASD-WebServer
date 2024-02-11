require('dotenv').config();

module.exports = {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_DEV_HOST,
    port: process.env.DB_DEV_PORT,
    name: process.env.DB_DEV_NAME,
    user: process.env.DB_DEV_USER,
    password: process.env.DB_DEV_PASS
}

