const express = require('express');
const path = require('path');
const QR = require('qrcode');
const { Sequelize, DataTypes, Op } = require ('sequelize');
const moment = require('moment');
const { Docente, Actividad, Espacio, Asignatura, Grupo, Recurrencia, Excepcion, Plan, Titulacion } = require('./models');
const app = express();
const port = 5500;

let sesion = null

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  console.log('Get / detected');
  if (checkSesion(res)) {
    res.redirect("/index.html");
  }
});

app.post('/login.html', async (req, res) => {
  console.log(`Got a POST in login with ${JSON.stringify(req.body)}`);

  const sequelize = new Sequelize({ dialect: 'sqlite', storage: './tfg_db.db'});

  try {
      await sequelize.authenticate();
      console.log('Connection successful.');
  }
  catch (error) {
      console.error('Unable to connect:', error);
  }

  const docente = Docente.model(sequelize, DataTypes);
  await docente.sync();

  console.log('Searching in Docente for id, email, password, nombre, apellidos');

  const query = await docente.findOne({
    attributes: ['id', 'email', 'password', 'nombre', 'apellidos'],
    where: {
      email: req.body.usuario
    }
  })

  if (query != null && query.dataValues.password == req.body.password) {
    sesion = { id: query.dataValues.id, nombre: query.dataValues.nombre, apellidos: query.dataValues.apellidos, email: query.dataValues.email };
    res.redirect("/index.html");
  }
  else {
    res.render('login', {usuario: req.body.usuario});
  }

  await sequelize.close();

});

app.get('/formulario-aulas.html', async (req, res) => {
  console.log('Got a GET in formulario-aulas.html');
  //Añadir comprobaciones (Sesión iniciada, tiene clases en ese periodo, etc.)
  if (checkSesion(res) && req.query.all != 'yes') {

    sequelize = new Sequelize({dialect: 'sqlite', storage: 'tfg_db.db'});
    
    const actividad = Actividad.model(sequelize, DataTypes);
    const espacio = Espacio.model(sequelize, DataTypes);
    const join_actividad_espacio = sequelize.define('Join_Actividad_Espacio', {}, { freezeTableName: true }); //Tabla de la relación en (Actividad en Espacio)
    const join_actividad_docentes = sequelize.define('Join_Actividad_Docentes', {}, { freezeTableName: true }); //Tabla de la relación imparte (Docente imparte Actividad)
    
    await sequelize.sync();
    
    console.log('Searching in Join_Actividad_Docentes for actividad_id');
    const query = await join_actividad_docentes.findAll({
      attributes: ['actividad_id'], 
      where: { 
        docente_id: sesion.id
      }
    });

    //Si tiene actividades
    if (query.length != 0) {

      console.log(query);

      let actividades_ids = [];
      query.forEach((act) => {
        actividades_ids.push(act.dataValues.actividad_id);
      });

      console.log('Searching in Actividad for id, tiempo_inicio, tiempo_fin');
      
      //Comprobamos que estén en la franja horaria actual
      const query_act = await actividad.findAll({
        attributes:['id', 'tiempo_inicio', 'tiempo_fin'],
        where: {
          id: {
            [Op.or]: actividades_ids
          }
        }
      });

      const currentHour = '16:30';//moment().format('HH:MM');
      let actividades_posibles = [];
      query_act.forEach((act) => {
        if (act.dataValues.tiempo_inicio <= currentHour && currentHour <= act.dataValues.tiempo_fin) {
          actividades_posibles.push(act.dataValues.id);
        }
      });

      //Si hay actividades posibles en estos momentos buscamos sus espacios
      if (actividades_posibles.length != 0) {

        console.log('Searching in Join_Actividad_Espacio for espacio_id');
        
        //Encontramos todos los ids de los espacios pertenecientes a actividades posibles
        const query_esp = await join_actividad_espacio.findAll({
          attributes:['espacio_id'],
          where: {
            actividad_id: {
              [Op.or]: actividades_posibles
            }
          }
        });

        //Obtenemos los espacios de las actividades
        let espacios_ids = [];
        query_esp.forEach((esp) => {
          espacios_ids.push(esp.dataValues.espacio_id)
        });

        console.log('Searching in Espacio for numero, tipo');
        const query_res = await espacio.findAll({
          attributes:['numero', 'tipo'],
          where: {
            id: {
              [Op.or]: espacios_ids
            }
          }
        });
        
        //Sacamos un array de los espacios que coinciden
        let espacios = [];

        query_res.forEach((esp) => {
          espacios.push(esp.dataValues);
        });

        console.log(espacios);
        //Enseñamos únicamente los espacios que coincidan con las actividades
        res.render('formulario-aulas', { espacios });
        return;
      }
      
    }
    
  }

  // Si no hay actividades posibles, se muestran todas los espacios
  res.sendFile(path.join(__dirname, '/formulario-aulas.html'));

});

app.post('/formulario-aulas.html', (req, res) => {
  console.log(`Got a POST in formulario-aulas with ${JSON.stringify(req.body)}`);
  if (req.body.espacio == "Otro") {
    res.redirect('/formulario-aulas.html/?all=yes');
  }
  else {
    res.redirect(`/formulario-end.html/?espacio=${req.body.espacio}`);
  }
});

app.get('/formulario-end.html', async (req, res) => {
  console.log(req.query);
  let esp = '';
  if(Object.keys(req.query).length != 0) {
    esp = req.query.espacio;
  }
  let currentHour = moment().format('HH:MM');

  // query a base de datos para conseguir asignatura y grupo que sería

  const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'tfg_db.db' });

  const join_actividad_docentes = sequelize.define('Join_Actividad_Docentes', {}, { freezeTableName: true });
  const join_actividad_clase = sequelize.define('Join_Actividad_Clase', {}, { freezeTableName: true });
  const join_actividad_espacio = sequelize.define('Join_Actividad_Espacio', {}, { freezeTableName: true });
  const actividad = Actividad.model(sequelize, DataTypes);
  const espacio = Espacio.model(sequelize, DataTypes);
  const clase = sequelize.define('Clase', {}, { freezeTableName: true });
  const asignatura = Asignatura.model(sequelize, DataTypes);
  const grupo = Grupo.model(sequelize, DataTypes);

  await sequelize.sync();
  
  console.log('Searching in Join_Actividad_Docentes for actividad_id');
  const query = await join_actividad_docentes.findAll({
    attributes: ['actividad_id'], 
    where: { 
      docente_id: sesion.id
    }
  });

  //Si tiene actividades
  if (query.length != 0) {

    console.log(query);

    let actividades_ids = [];
    query.forEach((act) => {
      actividades_ids.push(act.dataValues.actividad_id);
    });

    console.log('Searching in Actividad for id, tiempo_inicio, tiempo_fin');

    //Comprobamos que estén en la franja horaria actual
    const query_act = await actividad.findAll({
      attributes:['id', 'tiempo_inicio', 'tiempo_fin'],
      where: {
        id: {
          [Op.or]: actividades_ids
        }
      }
    });

    const currentHour = '16:30';//moment().format('HH:MM');
    let actividades_posibles = [];
    query_act.forEach((act) => {
      if (act.dataValues.tiempo_inicio <= currentHour && currentHour <= act.dataValues.tiempo_fin) {
        actividades_posibles.push(act.dataValues.id);
      }
    });

    
    
    if (actividades_posibles.length != 0) {

      const esp_split = esp.split(" ");

      console.log('Searching in Espacio for id');

      query_esp_id = await espacio.findOne({
        attributes: ['id'],
        where: {
          tipo: esp_split[0],
          numero: parseInt(esp_split[1])
        }
      });

      //Si hay más de una, qué hacemos??
      console.log('Searching in Join_Actividad_Espacio for actividad_id');
      query_esp_act = await join_actividad_espacio.findOne({
        attributes:['actividad_id'],
        where: {
          espacio_id: query_esp_id.dataValues.id,
          actividad_id: {
            [Op.or]: actividades_posibles
          }
        }
      });

      console.log('Searching in Join_Actividad_Clase for clase_id');
      query_act_clase = await join_actividad_clase.findOne({
        attributes:['clase_id'],
        where: {
          actividad_id: query_esp_act.dataValues.actividad_id
        }
      });

      // let clases_posibles = [];

      // query_act_clase.forEach((cl) => {
      //   clases_posibles.push(cl.dataValues.clase_id);
      // });

      console.log('Searching in Clase for asignatura_id, grupo_id');
      query_clase = await clase.findOne({
        attributes:['asignatura_id', 'grupo_id'],
        where: {
          id: {
            [Op.or]: [query_act_clase.dataValues.clase_id] // clases_posibles
          } 
        }
      });

      // let asignaturas = []
      // let grupos = []

      console.log('Searching in Asignatura for nombre, siglas');
      query_asig = await asignatura.findOne({
        attributes:['nombre', 'siglas'],
        where: {
          id:{
            [Op.or]: [query_clase.dataValues.asignatura_id]
          }
        }
      });

      console.log('Searching in Grupo for curso, letra');
      query_grupo = await grupo.findOne({
        attributes:['curso', 'letra'],
        where: {
          id:{
            [Op.or]: [query_clase.dataValues.grupo_id]
          }
        }
      });

      const str_asig = query_asig.dataValues.nombre + " (" + query_asig.dataValues.siglas + ")";
      const str_grupo = query_grupo.dataValues.curso + "º" + query_grupo.dataValues.letra;

      res.render('formulario-end', {usuario: sesion.nombre + " " + sesion.apellidos, espacio: esp, hora: `${currentHour}`, asignaturaygrupo: str_asig + " " + str_grupo});
      return;
    }
  }

  res.render('formulario-end', {usuario: sesion.nombre + " " + sesion.apellidos, espacio: esp, hora: `${currentHour}`, asignaturaygrupo: ""});
});

app.post('/formulario-end.html', async (req, res) => {
  console.log(req.body);
  
  // Hacer query a base de datos para marcar la asistencia
  
  // const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'tfg_db.db' });

  // const actividad = Actividad.model(sequelize, DataTypes);

  // await actividad.findAll({
  //   where: {

  //   }
  // });
});

app.post('/formulario-aulas-qr.html', (req, res) => {
  console.log(`Got a POST in formulario-aulas-qr with ${JSON.stringify(req.body)}`);
  res.redirect(`/formulario-end-qr.html/?espacio=${req.body.espacio}`);
});

app.get('/formulario-end-qr.html', (req, res) => { //NO CARGA EL QR
  console.log(req.query);
  const terminacion = (req.query.espacio.toLowerCase()).replace(" ", "");
  console.log(terminacion);
  let qrsrc = path.join(__dirname, 'js/qrs/qr_' + terminacion + '.png');
  console.log(qrsrc);
  // Falta hacer el QR de manera dinámica (preguntar)
  // QR.toFile(qrsrc, `http://localhost:5500/formulario-end-qr.html/?espacio=${req.query.espacio}`, {
  //   errorCorrectionLevel: 'M' // Al verse en una pantalla de ordenador, L o M sirven, si no, H
  // }, function(err) {
  //   if (err) throw err;
  //   console.log('QR code saved!');
  // });
  res.render('formulario-end-qr', { qrimg: qrsrc });
});

app.get('/lista-registro-motivo-falta', (req, res) => {
  console.log(req.query);

  // query a base de datos para conseguir asignaturas sin asistir, sin motivo del docente
  // clases = array con json de cada clase
  clases = [{fechayhora:"12/12/2023 12:00", asignaturaygrupo:"ASOR A" }, {fechayhora:"2/12/2023 11:00", asignaturaygrupo:"AC A" }];

  res.render('lista-registro-motivo-falta', clases );
});

app.post('/lista-registro-motivo-falta', (req, res) => {
  console.log(`Got a POST in lista-registro-motivo-falta with ${JSON.stringify(req.body)}`);

  res.render('registro-motivo-falta', req.body );
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});

// Utiliza __dirname como directorio para los ficheros, lo que permite que cargue el css de los archivos.
// Importante que esté debajo de get '/', para que este rediriga a login.html (Si no, abre index.html)
app.use(express.static(__dirname));

//Funcion auxiliar para redirigir a /login.html si no hay sesión iniciada
function checkSesion(res) {
  if (sesion == null) {
    res.redirect('/login.html');
    return false;
  }
  return true;
}