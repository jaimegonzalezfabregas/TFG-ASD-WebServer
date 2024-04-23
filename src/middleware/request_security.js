const he = require('he');

function escapeRequest(req, res, next) {
    for(key in req.body) {
        let value = req.body[key];
        req.body[key] = accentIgnorer(value);
    }
    next()
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

function checkRequest(body_list) {
    return (req, res, next) => {
        for (elem in body_list) {
            if (!req.body[body_list[elem]]) {
                res.render('error', {error: 'Datos no válidos', redirect: req.originalUrl});
                return false;
            }
        }
        
        next();
        return true;
    }
}

module.exports = {
    escapeRequest, checkRequest
}