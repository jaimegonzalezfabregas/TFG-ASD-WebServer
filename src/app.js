const express = require('express');
const path = require('path');
const { Sequelize, DataTypes, Op } = require ('sequelize');
const moment = require('moment');
const session = require('express-session')
const session_controller =  require('./controllers/app/session.controller.js');
const form_controller =  require('./controllers/app/form.controller.js');
require('dotenv').config();
const db_config = require('./config/db.config.js');
const { Docente, Actividad, Espacio, Asignatura, Grupo, Recurrencia, Excepcion, Plan, Titulacion, Asistencia } = require('./models');
const messaging = require('./messaging.js');
const app = express();
const port = 5500;
const staticname = __dirname + '/public';

const valoresRol = ['Docente', 'Decanato', 'Admin'];
const valoresAsistencia = ['Asistida', 'Asistida con Irregularidad', 'No Asistida'];

app.set('views', path.join(staticname, '/views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'keyboard cat', //TODO Poner algo un pelín más secreto
  resave: false,
  saveUninitialized: true,
  // Hacer la sesión expirable
  cookie: {
    maxAge: 30 * 60 * 1000 // 30 minutos en milisegundos
  }
}));

// Página web
app.get('/', checkSesion, (req, res) => {
  console.log('Get / detected');
  res.render('index', {usuario: req.session.user});
});

app.get('/login', (req, res) => {
  res.render('login', {usuario: ''}); 
})

app.post('/login', async (req, res) => {
  console.log(`Got a POST in login with ${JSON.stringify(req.body)}\n`);
  await session_controller.login(req, res);
});

app.get('/logout', checkSesion, async (req, res) => {
  console.log('Got a GET in logout');
  await session_controller.logout(req, res);
});

app.get('/formulario-aulas', checkSesion, async (req, res) => {
  console.log('Got a GET in formulario-aulas');
  await form_controller.getEspaciosPosibles(req, res);
});

app.post('/formulario-aulas', checkSesion, (req, res) => {
  console.log(`Got a POST in formulario-aulas with ${JSON.stringify(req.body)}`);
  form_controller.confirmEspacioPosible(req, res);
});

app.get('/formulario-end', checkSesion, async (req, res) => {
  console.log(`Got a GET in formulario-end with ${JSON.stringify(req.body)}`);
  await form_controller.getForm(req, res);
});

app.post('/formulario-end', checkSesion, async (req, res) => {
  console.log(`Got a POST in formulario-end with ${JSON.stringify(req.body)}`);
  form_controller.postForm(req, res);
});

app.get('/formulario-aulas-qr', checkSesion, async (req, res) => {
  console.log('Got a GET in formulario-aulas-qr');
  await form_controller.getAllEspacios(req, res);
});

app.post('/formulario-aulas-qr', checkSesion, (req, res) => {
  console.log(`Got a POST in formulario-aulas-qr with ${JSON.stringify(req.body)}`);
  res.render(`formulario-end-qr/?espacio=${req.body.espacio}`, {usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}});
});

app.get('/formulario-end-qr', checkSesion, (req, res) => { //NO CARGA EL QR
  console.log('Got a GET in formulario-end-qr');
  res.render('formulario-end-qr', {usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}});
});

app.post('/formulario-end-qr', checkSesion, (req, res) => { //NO CARGA EL QR
  console.log(`Got a POST in formulario-end-qr with ${JSON.stringify(req.body)}`);
  res.render('formulario-end-qr.html', {usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}});
});

app.get('/lista-registro-motivo-falta', checkSesion, (req, res) => {
  console.log(req.query);

  // query a base de datos para conseguir asignaturas sin asistir, sin motivo del docente
  // clases = array con json de cada clase
  clases = [{fechayhora:"12/12/2023 12:00", asignaturaygrupo:"ASOR A" }, {fechayhora:"2/12/2023 11:00", asignaturaygrupo:"AC A" }];

  res.render('lista-registro-motivo-falta', clases );
});

app.post('/lista-registro-motivo-falta', checkSesion, (req, res) => {
  console.log(`Got a POST in lista-registro-motivo-falta with ${JSON.stringify(req.body)}`);

  res.render('registro-motivo-falta', req.body );
});

app.get('/anular-clase', checkSesion, (req, res) => {
  console.log(req.query);
  
  res.render('anular-clase', {fecha: moment().format('YYYY-MM-DDTHH:MM')} );
});

app.post('/anular-clase', checkSesion, async (req, res) => {
  console.log(`Got a POST in anular-clase with ${JSON.stringify(req.body)}`);
  //clase_controller.anularClase(req, res)
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
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