const he = require('he');

function escapeRequest(req) {
    for(key in req.body) {
        let value = req.body[key];
        console.log(value)
        req.body[key] = he.encode(value);
        console.log(req.body[key]);
    }
}

module.exports = {
    escapeRequest
}