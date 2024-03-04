const messaging = require('../../messaging');

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
    console.log('ERROR');
    res.render('login', { usuario: req.body.usuario, error: 'Usuario o contraseña incorrectos' });
    return;
  }

  const sesion = { id: usuario.id, nombre: usuario.nombre, apellidos: usuario.apellidos, email: usuario.email, rol: usuario.rol };

  req.session.regenerate(function (err) {
    if (err) next(err)

    // Guardar info del usuario en session
    req.session.user = sesion;

    // Guardar la sesión y luego redirigir
    req.session.save(function (err) {
      if (err) return next(err)
  
      console.log(req.session);

      console.log(redirectTo);
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
      res.render('index', {usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}});
    });
  });
}

module.exports = {
  login, logout
}