const messaging = require('../../messaging');

async function login(req, res) {
  const redirectTo = req.session.redirectTo || '/';
  delete req.session.redirectTo;

  let data = { 
    email: req.body.usuario,
    password: req.body.password
  }
  
  let usuario = await (messaging.sendToApiJSON(data, '/login', res));

  if (usuario != null) {
    const sesion = { id: usuario.id, nombre: usuario.nombre, apellidos: usuario.apellidos, email: usuario.email };

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
  else {
    res.render('login', { usuario: req.body.usuario });
  }
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

module.exports = {
  login, logout
}