const keepAlways = ['id', 'email', 'nombre', 'apellidos', 'rol', 'offset'];

//keepCookies(['espacio_id', 'actividad_id']) = Mantener vivas todas las cookies que sean espacio_id o actividad_id, o formen parte de keepAlways
function keepCookies(cookie_list) { 
    return (req, res, next) => {
        let curr_cookies = req.session.user;
        for (cookie_key in curr_cookies) {
            if (!(keepAlways.includes(cookie_key) || cookie_list.includes(cookie_key))) {
                delete req.session.user[cookie_key];
            }
        }
        next();
        return true;
    }
}

module.exports = {
    keepCookies
}

