const http = require('http');
const wretch = require('wretch');
const api_config = require('./config/api.config');

const api = wretch(`http://${api_config.host}:${api_config.port}${api_config.path}`);

async function getFromApi(req_path, server_response, omit_error) {

    const getResult = await api.get(req_path)
    .error(response => {
        if (!omit_error && response.status >= 400 && response.status < 500) {
            throw response.status
        }
        else {
            server_response.status(500).send("Something went wrong");
            console.log(`Received status code ${response.status} on a get to ${req_path}`);
            return null;
        }
    }).res(async response => { 
        return (response.headers.get('Content-Type').includes('application/json')) ? response.json() : response.text();
    });
    return getResult;
}

async function sendToApiJSON(json, req_path, server_response, omit_error) {
    
    const postResult = await api.post(json, req_path)
    .error(response => {
        if (!omit_error && response.status >= 400 && response.status < 500) {
            throw response.status
        }
        else {
            server_response.status(500).send("Something went wrong");
            console.log(`Received status code ${response.status} on a post to ${req_path}`);
            return null;
        }
    }).res(async response => { 
        return (response.headers.get('Content-Type').includes('application/json')) ? response.json() : response.text();
    });
    return postResult;
}

module.exports = { sendToApiJSON, getFromApi };