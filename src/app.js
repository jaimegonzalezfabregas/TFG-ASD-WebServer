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
  res.sendFile(path.join(staticname, "/index.html"));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(staticname, '/login.html'));
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
  res.redirect(`/formulario-end-qr/?espacio=${req.body.espacio}`);
});

app.get('/formulario-end-qr', checkSesion, (req, res) => { //NO CARGA EL QR
  console.log('Got a GET in formulario-end-qr');
  res.sendFile(path.join(staticname, '/formulario-end-qr.html'));
});

app.post('/formulario-end-qr', checkSesion, (req, res) => { //NO CARGA EL QR
  console.log(`Got a POST in formulario-end-qr with ${JSON.stringify(req.body)}`);
  res.sendFile(path.join(staticname, '/formulario-end-qr.html'));
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

  const excepcion = Excepcion.model(sequelize, DataTypes);
  const grupo = Grupo.model(sequelize, DataTypes);
  const asignatura = Asignatura.model(sequelize, DataTypes);
  const actividad = Actividad.model(sequelize, DataTypes);
  const clase = sequelize.define('Clase', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }
  }, { freezeTableName: true });

  await sequelize.sync();

  const sl_grupo = req.body.asignatura.slice(req.body.asignatura.length - 4);
  const esp_grupo = el_grupo.split("º");

  const query_grupo = grupo.findAll({
    attributes: ['id'],
    where: {
      curso: esp_grupo[0],
      letra: esp_grupo[1]
    }
  });

  console.log('Asignatura');
  console.log(req.body.asignatura);
  const esp_asignatura = req.body.asignatura.split(" ");
  let nombre_asignatura = esp_asignatura[0];
  if (esp_asignatura.length > 3) {
    for (let i = 1; i < esp_asignatura.length - 2; i++) {
      nombre_asignatura = nombre_asignatura.join(nombre_asignatura[i]);
    }
  }

  const query_asignatura = asignatura.findAll({
    attributes: ['id'],
    where: {
      nombre: nombre_asignatura
    }
  });

  const query_clase = clase.findAll({
    attributes: ['id'],
    where: {
      grupo_id: query_grupo.dataValues.id,
      asignatura_id: query_asignatura.dataValues.id
    }
  });

  const query_actividad = actividad.findAll({
    attributes: ['id', 'fecha_inicio', 'fecha_fin', 'tiempo_incio', 'tiempo_fin'],
    where: {
      clase_id: query_clase.dataValues.id
    }
  });

  excepcion.create({actividad_id: query_actividad.dataValues.id, esta_reprogramado: 'No', esta_cancelado: 'Sí', 
    fecha_inicio: query_actividad.dataValues.fecha_inicio, fecha_fin: query_actividad.dataValues.fecha_fin, 
    tiempo_inicio: query_actividad.dataValues.tiempo_incio, tiempo_fin: query_actividad.dataValues.tiempo_fin, 
    es_todo_el_día: 'No', creado_por: req.session.user.nombre
  });

  res.redirect('/');
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});

// Utiliza staticname como directorio para los ficheros, lo que permite que cargue el css de los archivos.
// Importante que esté debajo de get '/', para que este rediriga a login (Si no, se dirige a /index.html)
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
