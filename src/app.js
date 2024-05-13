const server_config = require('./config/server.config');
const logger = require('./config/logger.config').child({"process": "server"});
const {console_morgan, file_morgan} = require('./config/morgan.config');

const express = require('express');
const path = require('path');
const moment = require('moment');
const session = require('express-session');
const memory_store = require('memorystore')(session);
const app_controllers =  require('./controllers/app/');
const middleware = require("./middleware/");
const app = express();
const staticname = __dirname + '/public';

const valoresRol = ['Usuario', 'Decanato', 'Admin'];
const valoresAsistencia = ['Asistida', 'Asistida con Irregularidad', 'No Asistida'];

app.set('views', path.join(staticname, '/views'));
app.set('view engine', 'ejs');
app.use(console_morgan);
app.use(file_morgan);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: server_config.session_secret,
  resave: false,
  saveUninitialized: true,
  // Hacer la sesión expirable
  cookie: {
    maxAge: 30 * 60 * 1000 // 30 minutos en milisegundos
  },
  store: new memory_store({
    checkPeriod: 30 * 60 * 1000 // 30 minutos en milisegundos
  })
}));

// Página web
app.get('/', checkSesion, (req, res) => {
  logger.info('Get / detected');
  res.render('index', {usuario: req.session.user});
});

app.get('/login', (req, res) => {
  res.render('login', {usuario: ''}); 
})

app.post('/login', [middleware.request_security.escapeRequest, middleware.request_security.checkRequest(['usuario', 'password', 'timezone'])], async (req, res) => {
  logger.info(`Got a POST in login with ${JSON.stringify(req.body)}`);
  await app_controllers.session.login(req, res);
});

app.get('/logout', [checkSesion, middleware.cookie_mantainer.keepCookies([])], async (req, res) => {
  logger.info('Got a GET in logout');
  await app_controllers.session.logout(req, res);
});

app.get('/formulario-aulas', [checkSesion, middleware.cookie_mantainer.keepCookies([])], async (req, res) => {
  logger.info('Got a GET in formulario-aulas');
  await app_controllers.form.getEspaciosPosibles(req, res);
});

app.post('/formulario-aulas', [checkSesion, middleware.cookie_mantainer.keepCookies(['estado']), middleware.request_security.escapeRequest, 
    middleware.request_security.checkRequest(['espacio'])], (req, res) => {
  
  logger.info(`Got a POST in formulario-aulas with ${JSON.stringify(req.body)}`);
  app_controllers.form.confirmEspacioPosible(req, res);
});

app.get('/formulario-end', [checkSesion, middleware.cookie_mantainer.keepCookies(['estado'])], async (req, res) => {
  logger.info(`Got a GET in formulario-end with ${JSON.stringify(req.body)}`);
  await app_controllers.form.getForm(req, res);
});

app.post('/formulario-end', [checkSesion, middleware.cookie_mantainer.keepCookies(['actividades_ids', 'espacio_id', 'estado']),
    middleware.request_security.escapeRequest, middleware.request_security.checkRequest(['docente', 'espacio', 'hora'])], async (req, res) => {
  logger.info(`Got a POST in formulario-end with ${JSON.stringify(req.body)}`);
  app_controllers.form.postForm(req, res);
});

app.get('/formulario-aulas-qr', [checkSesion, middleware.cookie_mantainer.keepCookies([])], async (req, res) => {
  logger.info('Got a GET in formulario-aulas-qr');
  await app_controllers.form.getAllEspacios(req, res);
});

app.post('/formulario-aulas-qr', [checkSesion, middleware.cookie_mantainer.keepCookies([]), middleware.request_security.escapeRequest], 
    (req, res) => {
  logger.info(`Got a POST in formulario-aulas-qr with ${JSON.stringify(req.body)}`);
  res.redirect(`formulario-end-qr/?espacio=${req.body.espacio}`);
});

app.get('/formulario-end-qr', [checkSesion, middleware.cookie_mantainer.keepCookies([])], (req, res) => {
  logger.info('Got a GET in formulario-end-qr');
  res.render('formulario-end-qr', {usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}});
});

app.get('/lista-registro-motivo-falta', [checkSesion, middleware.cookie_mantainer.keepCookies([])], async (req, res) => {
  logger.info(`Got a GET in lista-registro-motivo-falta`);
  const resultado = await app_controllers.asistencia.getAJustificar(req, res);
  res.render('lista-registro-motivo-falta', {clases: resultado, 
    usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}
  });
});

app.get('/registro-motivo-falta', [checkSesion, middleware.cookie_mantainer.keepCookies(['no_justificadas'])], (req, res) => {
  logger.info(`Got a GET in registro-motivo-falta`);
  res.render('registro-motivo-falta', { resultado: {fechayhora: req.query.fecha, clase: req.query.clase}, 
    usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}
  });
});

app.post('/registro-motivo-falta', [checkSesion, middleware.cookie_mantainer.keepCookies(['no_justificadas']),
    middleware.request_security.escapeRequest, middleware.request_security.checkRequest(['motivo'])], (req, res) => {
  logger.info(`Got a POST in registro-motivo-falta with ${JSON.stringify(req.body)}`);
  app_controllers.asistencia.justificar(req, res);
});

app.get('/anular-clase', [checkSesion, middleware.cookie_mantainer.keepCookies([])], (req, res) => {
  logger.info(req.query);
  let fechayhora = req.query.fecha || moment.now();
  app_controllers.clase.getClases(req, res, fechayhora);
});

app.post('/anular-clase', [checkSesion, middleware.cookie_mantainer.keepCookies([]), middleware.request_security.escapeRequest, 
    middleware.request_security.checkRequest(['meeting_time', 'motivo'])], async (req, res) => {
  logger.info(`Got a POST in anular-clase with ${JSON.stringify(req.body)}`);
  app_controllers.clase.anularClase(req, res);
});

app.get('/verificar-docencias', [checkSesion, checkClearanceAdministracion, middleware.cookie_mantainer.keepCookies([])], async (req, res) => {
  logger.info(`Got a GET in verificar-docencias`);
  let resultado = await app_controllers.asistencia.verAsistencias(req, res);
  res.render('verificar-docencias', {usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos},
    fecha: resultado.fecha, fecha_max: resultado.fecha_max, asistencias: resultado.asistencias, valores_asist: valoresAsistencia
  });
});

app.post('/verificar-docencias', [checkSesion, checkClearanceAdministracion, middleware.cookie_mantainer.keepCookies([])], async (req, res) => {
  logger.info(`Got a POST in verificar-docencias with ${JSON.stringify(req.body)}`);
  let resultado = await app_controllers.asistencia.verAsistencias(req, res);
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send({asistencias: resultado.asistencias});
});

app.get('/registrar-firmas', [checkSesion, checkClearanceAdministracion, middleware.cookie_mantainer.keepCookies([])], async (req, res) => {
  logger.info(`Got a GET in registrar-firmas`);
  await app_controllers.asistencia.filtrarAsistencias(req, res);
});

app.post('/registrar-firmas', [checkSesion, checkClearanceAdministracion, 
    middleware.cookie_mantainer.keepCookies(['no_asistidas', 'sustituto_ids', 'resultado_firma', 'espacio_firma'],
    middleware.request_security.escapeRequest)], async (req, res) => {
  logger.info(`Got a POST in registrar-firmas with ${JSON.stringify(req.body)}`);
  if (req.body.postType == 'filtro') {
    middleware.request_security.checkRequest(req, ['fecha', 'espacio']);
    app_controllers.asistencia.filtrarAsistencias(req, res);
  }
  else if (req.body.postType == 'firma') {  
    middleware.request_security.checkRequest(req, ['pos']);
    app_controllers.asistencia.confirmarFirma(req, res);
  }
});

app.get('/crear-usuario', [checkSesion, checkClearanceAdministracion || checkClearanceDecanato, middleware.cookie_mantainer.keepCookies([])], async (req, res) => {
  logger.info(`Got a GET in crear-usuario`);
  let resultado = {
    email: '',
    nombre: '',
    apellidos: '',
    password: ''
  }
  res.render('crear-usuario', {resultado: resultado, usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}, 
      roles: valoresRol});
});

app.post('/crear-usuario', [checkSesion, checkClearanceAdministracion || checkClearanceDecanato, middleware.cookie_mantainer.keepCookies([]),
    middleware.request_security.escapeRequest, middleware.request_security.checkRequest(['nombre', 'apellidos', 'email', 'rol', 'password'])], 
    async (req, res) => {
  logger.info(`Got a POST in crear-usuario with ${JSON.stringify(req.body)}`);
  
  try {
    await app_controllers.session.createUser(req, res);
  }
  catch (error) {
    let redo = {
      email: req.body.email,
      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      password: req.body.password
    }
    res.render('crear-usuario', {resultado: redo, error: JSON.parse(error.message), usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}, roles: valoresRol});
    return;
  }
});

app.get('/registro-mac', [checkSesion, middleware.cookie_mantainer.keepCookies([]), middleware.request_security.escapeRequest], async (req, res) => {
  logger.info('Got a GET in registrar-macs');
  res.render('registro-mac', {usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}});
});

app.post('/registro-mac', [checkSesion, middleware.cookie_mantainer.keepCookies([]), middleware.request_security.escapeRequest, 
    middleware.request_security.checkRequest(['mac1'])], async (req, res) => {
  logger.info(`Got a POST in registro-mac with ${JSON.stringify(req.body)}`);
  
  try {
    await app_controllers.session.assignMAC(req, res);
  }
  catch (error) {
    res.render('registro-mac', {error: JSON.parse(error.message), usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}});
    return;
  }
});

app.get('/registro-nfc', [checkSesion, middleware.cookie_mantainer.keepCookies([]), middleware.request_security.escapeRequest], async (req, res) => {
  logger.info('Got a GET in registrar-macs');
  res.render('registro-nfc', {usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}});
});

app.post('/registro-nfc', [checkSesion, middleware.cookie_mantainer.keepCookies([]), middleware.request_security.escapeRequest,
    middleware.request_security.checkRequest(['nfc1'])], async (req, res) => {
  logger.info(`Got a POST in registro-nfc with ${JSON.stringify(req.body)}`);
  
  try {
    await app_controllers.session.assignNFC(req, res);
  }
  catch (error) {
    res.render('registro-nfc', {error: JSON.parse(error.message), usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}});
    return;
  }
});

app.get('/profesores-infracciones', [checkSesion, checkClearanceDecanato, middleware.cookie_mantainer.keepCookies([])], async (req, res) => {
  logger.info(`Got a GET in profesores-infracciones`);
  await app_controllers.asistencia.verProfesoresInfracciones(req, res);
});

app.listen(server_config.port, () => {
  const port_spec = (server_config.port_spec) ? ':' + server_config.port : ''
  logger.info(`App listening on port ${server_config.port} at ${server_config.protocol}://${server_config.host}${port_spec}`);
});

// Utiliza staticname como directorio para los ficheros, lo que permite que cargue el css de los archivos.
// Importante que esté debajo de get '/', para que este rediriga a login (Si no, se dirige a /index.ejs)
app.use(express.static(staticname));

// Funcion auxiliar para redirigir a /login si no hay sesión iniciada que guarda el valor de la página
// a redirigir después de hacer login
// Si emmitter == null, por defecto, el código de login lo enviará a /
function checkSesion(req, res, next) {
  if (req.session.user) {
    next();
  }
  else {
    req.session.redirectTo = req.originalUrl;
    req.session.save();
    res.redirect('/login');
  }
}

function checkClearanceDecanato(req, res, next) {
  if (req.session.user.rol == valoresRol[1]) {
    next();
    return true;
  }
  else {
    res.render('error', {error: 'No tienes permisos para acceder a esta página'})
    return false;
  }
}

function checkClearanceAdministracion(req, res, next) {
  if (req.session.user.rol == valoresRol[2]) {
    next();
    return true;
  }
  else {
    res.render('error', {error: 'No tienes permisos para acceder a esta página'})
    return false;
  }
}