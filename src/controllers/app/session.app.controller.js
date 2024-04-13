const messaging = require('../../messaging');
const logger = require('../../config/logger.config').child({"process": "server"});

async function login(req, res) {
  const redirectTo = req.session.redirectTo || '/';
  delete req.session.redirectTo;

  let data = { 
    email: req.body.usuario,
    password: req.body.password
  }
  
  let usuario 
  try {
    usuario = await (messaging.sendToApiJSON(data, '/login', res, false));
  }
  catch (error) {
    logger.error(`ERROR: ${error}`);
    res.render('login', { usuario: req.body.usuario, error: 'Usuario o contraseña incorrectos' });
    return;
  }

  const sesion = { id: usuario.id, nombre: usuario.nombre, apellidos: usuario.apellidos, email: usuario.email, rol: usuario.rol, offset: Number(req.body.timezone) };

  req.session.regenerate(function (err) {
    if (err) next(err)

    // Guardar info del usuario en session
    req.session.user = sesion;

    // Guardar la sesión y luego redirigir
    req.session.save(function (err) {
      if (err) return next(err)

      res.redirect(redirectTo);
    });
  });
}

function logout(req, res) {
  req.session.user = null
  req.session.redirectTo = null
  req.session.save(function (err) {
    if(err) next(err)
      
    req.session.regenerate(function (err) {
      if (err) next(err)
      res.redirect('/');
    });
  });
}

async function createUser(req, res) {
  let resultado = {
    email: req.body.email,
    nombre: req.body.nombre,
    apellidos: req.body.apellidos,
    password: req.body.password,
    rol: req.body.rol,
    creador: req.session.user.id
  }

  await messaging.sendToApiJSON(resultado, '/usuarios', res, false);
  res.render('exito', {mensaje: 'Usuario creado con éxito'});

}

module.exports = {
  login, logout, createUser
}