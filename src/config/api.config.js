require('dotenv').config();

module.exports = {
    host: process.env.API_HOST,
    port: process.env.API_PORT,
    path: process.env.API_PATH
}

