
const keepAlways = ['id', 'email', 'nombre', 'apellidos', 'rol'];

//keepCookies(['espacio_id', 'actividad_id']) = Mantener vivas todas las cookies que sean espacio_id o actividad_id, o formen parte de keepAlways
function keepCookies(req, res, cookie_list) { 
    let curr_cookies = req.session.user;
    console.log(curr_cookies);
    for (cookie_key in curr_cookies) {
        console.log(cookie_key);
        if (!(keepAlways.includes(cookie_key) || cookie_list.includes(cookie_key))) {
            console.log('Deleting cookie ', cookie_key, ': ', req.session.user[cookie_key]);
            delete req.session.user[cookie_key];
        }
    }
    console.log('FIN COOKIES');
    return true;
}

module.exports = {
    keepCookies
}

