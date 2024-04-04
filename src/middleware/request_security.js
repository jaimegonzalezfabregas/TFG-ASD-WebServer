const he = require('he');

function escapeRequest(req) {
    for(key in req.body) {
        let value = req.body[key];
        req.body[key] = accentIgnorer(value);
    }
}

// Usado para no escapar tildes y ñ (estamos en España)
function accentIgnorer(str) {
    let encoded_str = '';
    
    for (let i = 0; i < str.length; i++) {
		let chr = str[i];
        if (/[áàâäéèêëíìîïóòôöúùûüñ]/i.test(chr)) {
            encoded_str += chr
        }
		else {
			encoded_str += he.encode(chr);
		}
    }

    return encoded_str;
}

module.exports = {
    escapeRequest
}