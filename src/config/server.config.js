require('dotenv').config();

let host = (process.env.SERVER_HOST) ? process.env.SERVER_HOST : 'localhost';

module.exports = {
    host: host,
    port: (process.env.SERVER_PORT) ? process.env.SERVER_PORT : 3000,
    path: (process.env.SERVER_PATH) ? process.env.SERVER_PATH : '',
    protocol: (process.env.SERVER_PROTOCOL) ? process.env.SERVER_PROTOCOL : "http",
    port_spec: (process.env.SERVER_PORT_SPECIFICATION === "true" || host == 'localhost') ? true : false,
    session_secret: (process.env.SESSION_SECRET) ? process.env.SESSION_SECRET : 'secretoPocoSeguro'
}