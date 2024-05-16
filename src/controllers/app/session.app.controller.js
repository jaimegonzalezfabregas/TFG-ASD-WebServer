const logger = require('../../config/logger.config').child({"process": "server"});

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
    logger.error(error);
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

  try {
    await messaging.sendToApiJSON(resultado, '/usuarios', res, false);
    res.render('exito', {mensaje: 'Usuario creado con éxito'});
  }
  catch (error) {
    logger.error(error);
    throw error;
  }

}

async function assignMAC(req, res) {

  let mac_regex = /^([0-9A-F]{2}[:]){5}([0-9A-F]{2})$/

  for (mac in req.body) {
    if (req.body[mac] != null) { 
      console.log(req.body[mac], mac);
      let mac_string = (req.body[mac]).toUpperCase();
      console.log(mac_string);
      if (mac_regex.test(mac_string)) {
        try {
          await messaging.sendToApiJSON({ mac: mac_string }, `/usuarios/macs/${req.session.user.id}`, res, true);
        }
        catch (error) {
          logger.error(error);
          throw error;
        }
      }
      else if (!mac_regex.test(mac_string)) {
        res.render('registro-mac', {error: {error: 'Datos no válidos'}, usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}});
      }
    }
  }

  res.render('exito', {mensaje: "Registro de MAC completado exitosamente"});
}

async function assignNFC(req, res) {

  let nfc_regex = /^\d+$/

  for (uid in req.body) {
    if (req.body[uid] != null && nfc_regex.test(req.body[uid])) {
      try {
        await messaging.sendToApiJSON({ uid: req.body[uid] }, `/usuarios/nfcs/${req.session.user.id}`, res, true);
      }
      catch (error) {
        logger.error(error);
        throw error;
      }
    }
  }

  res.render('exito', {mensaje: 'Registro de UID de NFC completado exitosamente'});
}

module.exports = {
  login, logout, createUser, assignMAC, assignNFC
}
