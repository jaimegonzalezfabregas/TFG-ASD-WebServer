const http = require('http');
const wretch = require('wretch');
const api_config = require('./config/api.config');

const api = wretch(`http://${api_config.host}:${api_config.port}${api_config.path}`);

async function getFromApi(req_path) {
    const getResult = await api.get(req_path).json();
    console.log(`{${JSON.stringify(getResult)}}`);
    return getResult;
}

async function sendToApiJSON(json, req_path) {
    const postResult = await api.post(json, req_path).json();
    console.log(`{${JSON.stringify(postResult)}}`);
    return postResult;
}

module.exports = { sendToApiJSON, getFromApi };