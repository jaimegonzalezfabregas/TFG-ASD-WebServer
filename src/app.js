const express = require('express');
const path = require('path');
const moment = require('moment');
const session = require('express-session');
const memory_store = require('memorystore')(session);
const app_controllers =  require('./controllers/app/');
const middleware = require("./middleware/");
const server_config = require('./config/server.config');
const app = express();
const logger = require('./config/logger.config').child({"process": "server"});
const staticname = __dirname + '/public';

const valoresRol = ['Usuario', 'Decanato', 'Admin'];

app.set('views', path.join(staticname, '/views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'AJD2DJA83JFYUB3674HHJIHaD7JJ91BFNISYCY2UF',
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

app.post('/login', async (req, res) => {
  middleware.request_security.escapeRequest(req);
  logger.info(`Got a POST in login with ${JSON.stringify(req.body)}`);
  await app_controllers.session.login(req, res);
});

app.get('/logout', checkSesion, async (req, res) => {
  middleware.cookie_mantainer.keepCookies(req, res, [])
  logger.info('Got a GET in logout');
  await app_controllers.session.logout(req, res);
});

app.get('/formulario-aulas', checkSesion, async (req, res) => {
  middleware.cookie_mantainer.keepCookies(req, res, []);
  logger.info('Got a GET in formulario-aulas');
  await app_controllers.form.getEspaciosPosibles(req, res);
});

app.post('/formulario-aulas', checkSesion, (req, res) => {
  middleware.cookie_mantainer.keepCookies(req, res, ['estado']);
  middleware.request_security.escapeRequest(req);
  logger.info(`Got a POST in formulario-aulas with ${JSON.stringify(req.body)}`);
  app_controllers.form.confirmEspacioPosible(req, res);
});

app.get('/formulario-end', checkSesion, async (req, res) => {
  middleware.cookie_mantainer.keepCookies(req, res, ['estado']);
  logger.info(`Got a GET in formulario-end with ${JSON.stringify(req.body)}`);
  await app_controllers.form.getForm(req, res);
});

app.post('/formulario-end', checkSesion, async (req, res) => {
  middleware.cookie_mantainer.keepCookies(req, res, ['actividades_ids', 'espacio_id', 'estado']);
  middleware.request_security.escapeRequest(req);
  logger.info(`Got a POST in formulario-end with ${JSON.stringify(req.body)}`);
  app_controllers.form.postForm(req, res);
});

app.get('/formulario-aulas-qr', checkSesion, async (req, res) => {
  logger.info('Got a GET in formulario-aulas-qr');
  await app_controllers.form.getAllEspacios(req, res);
});

app.post('/formulario-aulas-qr', checkSesion, (req, res) => {
  middleware.request_security.escapeRequest(req);
  logger.info(`Got a POST in formulario-aulas-qr with ${JSON.stringify(req.body)}`);
  res.redirect(`formulario-end-qr/?espacio=${req.body.espacio}`);
});

app.get('/formulario-end-qr', checkSesion, (req, res) => {
  logger.info('Got a GET in formulario-end-qr');
  res.render('formulario-end-qr', {usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}});
});

app.post('/formulario-end-qr', checkSesion, (req, res) => {
  middleware.request_security.escapeRequest(req);
  logger.info(`Got a POST in formulario-end-qr with ${JSON.stringify(req.body)}`);
  res.render('formulario-end-qr', {usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}});
});

app.get('/lista-registro-motivo-falta', checkSesion, async (req, res) => {
  logger.info(`Got a GET in lista-registro-motivo-falta`);
  const resultado = await app_controllers.asistencia.getAJustificar(req, res);
  res.render('lista-registro-motivo-falta', {clases: resultado, 
    usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}
  });
});

app.get('/registro-motivo-falta', checkSesion, (req, res) => {
  middleware.cookie_mantainer.keepCookies(req, res, ['no_justificadas']);
  logger.info(`Got a GET in registro-motivo-falta`);
  res.render('registro-motivo-falta', { resultado: {fechayhora: req.query.fecha, clase: req.query.clase}, 
    usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}
  });
});

app.post('/registro-motivo-falta', checkSesion, (req, res) => {
  middleware.cookie_mantainer.keepCookies(req, res, ['no_justificadas']);
  middleware.request_security.escapeRequest(req);
  logger.info(`Got a POST in registro-motivo-falta with ${JSON.stringify(req.body)}`);
  app_controllers.asistencia.justificar(req, res);
});

app.get('/anular-clase', checkSesion, (req, res) => {
  logger.info(req.query);
  let fechayhora = req.query.fecha || moment.now();
  app_controllers.clase.getClases(req, res, fechayhora);
});

app.post('/anular-clase', checkSesion, async (req, res) => {
  middleware.request_security.escapeRequest(req);
  logger.info(`Got a POST in anular-clase with ${JSON.stringify(req.body)}`);
  app_controllers.clase.anularClase(req, res);
});

app.get('/verificar-docencias', checkSesion, async (req, res) => {
  logger.info(`Got a GET in verificar-docencias`);
  res.render('verificar-docencias', {usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos},
    fecha: moment().format('YYYY-MM-DD'), asistencias: [{hora:'13:40', docente:'Marcelo Adilo Orense', espacio: 'Aula 4', clase: 'PD', estado: 'Asistida', motivo: ''}, 
    {hora:'13:40', docente:'Marcelo Adilo Orense', espacio: 'Aula 4', clase: 'PD', estado: 'Asistida', motivo: ''}, 
    {hora:'13:40', docente:'Marcelo Adilo Orense', espacio: 'Aula 4', clase: 'PD', estado: 'Asistida', motivo: ''}, 
    {hora:'13:40', docente:'Marcelo Adilo Orense', espacio: 'Aula 4', clase: 'PD', estado: 'Asistida', motivo: ''} ]
  });
});

app.get('/registrar-firmas', [checkSesion, checkClearanceAdministracion], async (req, res) => {
  logger.info(`Got a GET in registrar-firmas`);
  await app_controllers.asistencia.filtrarAsistencias(req, res);
});

app.post('/registrar-firmas', [checkSesion, checkClearanceAdministracion], async (req, res) => {
  middleware.cookie_mantainer.keepCookies(req, res, ['no_asistidas', 'sustituto_ids', 'resultado_firma', 'espacio_firma']);
  middleware.request_security.escapeRequest(req);
  logger.info(`Got a POST in registrar-firmas with ${JSON.stringify(req.body)}`);
  if (req.body.postType == 'filtro') app_controllers.asistencia.filtrarAsistencias(req, res);
  else if (req.body.postType == 'firma') app_controllers.asistencia.confirmarFirma(req, res);
});

app.get('/crear-usuario', [checkSesion, checkClearanceAdministracion || checkClearanceDecanato], async (req, res) => {
  logger.info(`Got a GET in crear-usuario`);
  let resultado = {
    email: '',
    nombre: '',
    apellidos: '',
    password: ''
  }
  res.render('crear-usuario', {resultado: resultado, usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}, roles: valoresRol});
});

app.post('/crear-usuario', [checkSesion, checkClearanceAdministracion || checkClearanceDecanato], async (req, res) => {
  middleware.request_security.escapeRequest(req);
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
    res.render('crear-usuario', {resultado: redo, error: error, usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}, roles: valoresRol});
    return;
  }
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