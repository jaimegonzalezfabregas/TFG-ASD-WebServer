require('dotenv').config();

let host = (process.env.API_HOST) ? process.env.API_HOST : 'localhost';

module.exports = {
    host: (process.env.API_HOST) ? process.env.API_HOST : 'localhost',
    port: (process.env.API_PORT) ? process.env.API_PORT : 3001,
    path: (process.env.API_PATH) ? process.env.API_PATH : '',
    protocol: (process.env.API_PROTOCOL) ? process.env.API_PROTOCOL : "http",
    port_spec: (process.env.API_PORT_SPECIFICATION === "true" || host == 'localhost') ? true : false,
    secrets: (process.env.API_ALLOWED) ? JSON.parse(process.env.API_ALLOWED) : ["",""] 
}

