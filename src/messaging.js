const api_config = require('./config/api.config');
const logger = require('./config/logger.config').child({"process": "messaging"});

const wretch = require('wretch');

const port_spec = (api_config.port_spec) ? ':' + api_config.port : '';
const api = wretch(`${api_config.protocol}://${api_config.host}${port_spec}${api_config.path}`);

async function getFromApi(req_path, server_response, omit_error) {

    const getResult = await api.headers({"X-Token": "app:" + api_config.secrets["app"]}).get(req_path)
    .error(response => {
        if (!omit_error && response.status >= 400 && response.status < 500) {
            throw response.status
        }
        else {
            server_response.status(response.status).send(response.text());
            logger.error(`Received status code ${response.status} on a get to ${req_path}`);
            return null;
        }
    }).res(async response => { 
        return (response.headers.get('Content-Type').includes('application/json')) ? response.json() : response.text();
    });
    return getResult;
}

async function sendToApiJSON(json, req_path, server_response, omit_error) {
    
    const postResult = await api.headers({"X-Token": "app:" + api_config.secrets["app"]}).post(json, req_path)
    .error(response => {
        if (!omit_error && response.status >= 400 && response.status < 500) {
            logger.error(`Received status code ${response.status} on a post to ${req_path}`);
            throw response.status
        }
        else {
            server_response.status(500).send("Something went wrong");
            logger.error(`Received status code ${response.status} on a post to ${req_path}`);
            return null;
        }
    }).res(async response => { 
        return (response.headers.get('Content-Type').includes('application/json')) ? response.json() : response.text();
    });
    return postResult;
}

module.exports = { sendToApiJSON, getFromApi };