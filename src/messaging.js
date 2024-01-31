const http = require('http');
const api_config = require('./config/api.config');

async function getFromApi(req_path) {
    return new Promise((resolve, reject) => {
        let options = {
            host: api_config.host,
            port: api_config.port,
            path: api_config.path + req_path,
            method: 'GET'
        };

        let result = "";
        let get = http.get(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                result += chunk;
            });
            res.on('end', function () {
                result = JSON.parse(result);
                return result;
            });
        });

        get.on('error', (error) => {
            reject(error);
        });

        get.end();
    });
}

function sendToApiJSON(json, req_path) {
    return new Promise((resolve, reject) => {
        let options = {
            host: api_config.host,
            port: api_config.port,
            path: api_config.path + req_path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(json))
            }
        };

        let result = "";
        let req = http.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                result += chunk;
            });
            res.on('end', function () {
                try {
                    resolve(JSON.parse(result));
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(JSON.stringify(json));
        req.end();
    });
}

module.exports = { sendToApiJSON, getFromApi };