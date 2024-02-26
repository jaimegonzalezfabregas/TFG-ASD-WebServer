const http = require('http');
const wretch = require('wretch');
const api_config = require('./config/api.config');

const api = wretch(`http://${api_config.host}:${api_config.port}${api_config.path}`);

async function getFromApi(req_path, server_response) {
    try {
        const getResult = await api.get(req_path)
        .error(response => {
            throw response.status;
        })
        .res(async response => { 
            return response.json();
        });
        console.log(`${JSON.stringify(getResult)}`);
        return getResult;
    }
    catch (err) {
        server_response.status(500).send("Something went wrong");
        console.log(`Received status code ${err} on a get to ${req_path}`);
    }
}

async function sendToApiJSON(json, req_path, server_response) {
    try {
        const postResult = await api.post(json, req_path)
        .error(response => {
            throw response.status;
        }).res(async response => { 
            return response.json();
        });
        console.log(`${JSON.stringify(postResult)}`);
        return postResult;
    }
    catch (err) {
        server_response.status(500).send("Something went wrong");
        console.log(`Received status code ${err} on a get to ${req_path}`);
    }
}

module.exports = { sendToApiJSON, getFromApi };