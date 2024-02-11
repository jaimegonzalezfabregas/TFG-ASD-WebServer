const express = require('express');
const path = require('path');
const { Sequelize, DataTypes, Op } = require ('sequelize');
const moment = require('moment');
require('dotenv').config();
const db_config = require('./config/db.config.js');
const { Docente, Actividad, Espacio, Asignatura, Grupo, Recurrencia, Excepcion, Plan, Titulacion, Asistencia } = require('./models');
const messaging = require('./messaging.js');
const app = express();
const port = 5500;
const staticname = __dirname + '/public';

let sesion = null
let toRedirect = null

app.set('views', path.join(staticname, '/views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Página web
app.get('/', (req, res) => {
  console.log('Get / detected');
  if (checkSesion(res, null)) {
    res.sendFile(path.join(staticname, "/index.html"));
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(staticname, '/login.html'));
})

app.post('/login', async (req, res) => {
  console.log(`Got a POST in login with ${JSON.stringify(req.body)}\n`);

  let data = { 
    email: req.body.usuario,
    password: req.body.password
  }
  
  let usuario = await (messaging.sendToApiJSON(data, '/login'));

  if (usuario != null) {
    sesion = { id: usuario.id, nombre: usuario.nombre, apellidos: usuario.apellidos, email: usuario.email };
    console.log(sesion);
    if (toRedirect) {
      res.redirect(toRedirect);
    }
    else {
      res.redirect("/");
    }
  }
  else {
    res.render('login', {usuario: req.body.usuario});
  }

});

app.get('/formulario-aulas', async (req, res) => {
  console.log('Got a GET in formulario-aulas');

  if (checkSesion(res, req.url)) {
    
    let data = { 
      opcion: (req.query.all != 'yes') ? "espacios_rutina" : "espacios_irregularidad"
    }

    const id_sesion = (sesion.id).toString();
    const api_path = `/usuarios/${id_sesion}`;
    let espacios_ids = (await messaging.sendToApiJSON(data, api_path)).espacios;

    let espacios_data = [];
    for (let i = 0; i < espacios_ids.length; i++) {
      const id_esp = (espacios_ids[i].id).toString();
      const api_esp_path = `/espacios/${id_esp}`;
      console.log(api_esp_path);
      espacios_data.push((await messaging.getFromApi(api_esp_path)));
    }

    //Sacamos un array separando los espacios por edificio ([{ edificio, espacios }, { edificio, espacios }, ...])
    let espacios_doc = [];
    let edif = null;
    espacios_data.forEach((esp) => {
      console.log(esp);
      if (esp.edificio != edif) {
        edif = esp.edificio;
        espacios_doc.push({ edificio: edif, espacios: []});
      }
      espacios_doc[espacios_doc.length - 1].espacios.push(esp.nombre );
    });

    console.log(espacios_doc);
    //Enseñamos únicamente los espacios que coincidan con las actividades
    res.render('formulario-aulas', { espacios: espacios_doc, all: (req.query.all == 'yes') });
    return;

  }

});

app.post('/formulario-aulas', (req, res) => {
  console.log(`Got a POST in formulario-aulas with ${JSON.stringify(req.body)}`);
  if (req.body.espacio == "Otro") {
    res.redirect('/formulario-aulas/?all=yes');
  }
  else {
    res.redirect(`/formulario-end/?espacio=${req.body.espacio}`);
  }
});

app.get('/formulario-end', async (req, res) => {
  console.log(req.query);
  console.log(Object.keys(req.query).length > 0, Object.keys(req.query).length);
  let redirection = null;
  if (Object.keys(req.query).length > 0) { 
    redirection = req.url;
  } 

  if (checkSesion(res, redirection)) { 
    let esp = '';
    if(Object.keys(req.query).length != 0) {
      esp = req.query.espacio;
    }
    const currentHour = '16:30';//moment().format('HH:MM');
    console.log(esp);

    // query a base de datos para conseguir asignatura y grupo que sería

    const sequelize = new Sequelize(db_config.name, db_config.user, db_config.password, { dialect: db_config.dialect, host: db_config.host, port: db_config.port});

    try {
      await sequelize.authenticate();
      console.log('Connection successful.');
    }
    catch (error) {
      console.error('Unable to connect:', error);
      res(500, "Something went wrong");
      return;
    }

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

      console.log(query_act);

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
            numero: parseInt(esp_split[1]),
            edificio: esp_split[2]
          }
        });

        console.log(query_esp_id);

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

        console.log('Searching in Clase for asignatura_id, grupo_id');
        query_clase = await clase.findOne({
          attributes:['asignatura_id', 'grupo_id'],
          where: {
            id: {
              [Op.or]: [query_act_clase.dataValues.clase_id] // clases_posibles
            } 
          }
        });

        console.log(query_clase);

        console.log('Searching in Asignatura for nombre, siglas');
        query_asig = await asignatura.findOne({
          attributes:['nombre', 'siglas'],
          where: {
            id:{
              [Op.or]: [query_clase.dataValues.asignatura_id]
            }
          }
        });

        console.log(query_asig);

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
  }
});

app.post('/formulario-end', async (req, res) => {
    console.log(req.body);
    // query a base de datos para conseguir asignatura y grupo que sería
  
    const sequelize = new Sequelize(db_config.name, db_config.user, db_config.password, { dialect: db_config.dialect, host: db_config.host, port: db_config.port});

    try {
      await sequelize.authenticate();
      console.log('Connection successful.');
    }
    catch (error) {
      console.error('Unable to connect:', error);
      res(500, "Something went wrong");
      return;
    }
  
    const espacio = Espacio.model(sequelize, DataTypes);
    const asistencia = Asistencia.model(sequelize, DataTypes);
    const actividad = Actividad.model(sequelize, DataTypes);
    const join_actividad_docentes = sequelize.define('Join_Actividad_Docentes', {}, { freezeTableName: true });
    const join_actividad_espacio = sequelize.define('Join_Actividad_Espacio', {}, { freezeTableName: true });
  
    post_espacio = req.body.espacio.split(' ');
  
    //Sacamos el id del espacio
    console.log('post_espacio');
    console.log(post_espacio);
  
    console.log('Searching in Espacio for id');
    const query_espacio = await espacio.findOne({
      attributes: ['id'],
      where: {
        tipo: post_espacio[0],
        numero: parseInt(post_espacio[1]),
        edificio: post_espacio[2]
      }
    });
  
    console.log(query_espacio);
  
    let state = 'Asistida con Irregularidad';
  
    console.log('Searching in Join_Actividad_Docentes for actividad_id');
    const query_actividades_docente = await join_actividad_docentes.findAll({
      attributes: ['actividad_id'],
      where: {
        docente_id: sesion.id
      }
    });
  
    if (query_actividades_docente.length != 0) {
  
      console.log(query_actividades_docente);
  
      let actividades_ids = [];
      query_actividades_docente.forEach((act) => {
        actividades_ids.push(act.dataValues.actividad_id);
      });
  
      //Comprobamos que estén en la franja horaria actual
      const query_act = await actividad.findAll({
        attributes:['id', 'tiempo_inicio', 'tiempo_fin'],
        where: {
          id: {
            [Op.or]: actividades_ids
          }
        }
      });
  
      console.log(query_act);
  
      const currentHour = '16:30';//moment().format('HH:MM');
      let actividades_posibles = [];
      query_act.forEach((act) => {
        if (act.dataValues.tiempo_inicio <= currentHour && currentHour <= act.dataValues.tiempo_fin) {
          actividades_posibles.push(act.dataValues.id);
        }
      });
  
      if (actividades_posibles.length != 0) {
        //Si hay más de una, qué hacemos??
        console.log('Searching in Join_Actividad_Espacio for actividad_id');
        query_esp_act = await join_actividad_espacio.findOne({
          attributes:['actividad_id'],
          where: {
            espacio_id: query_espacio.dataValues.id,
            actividad_id: {
              [Op.or]: actividades_posibles
            }
          }
        });
  
        if (query_esp_act != null) state = 'Asistida'; 
      }
    }
  
    //Intentamos crear y guardar la asistencia
    const transaction = await sequelize.transaction();
      
    try {
      await asistencia.create({espacio_id: query_espacio.id, docente_id: sesion.id, fecha: moment.now(), estado: state});
    } catch (error) {
        console.log('Error on asistencia creation: ', error);
    }
  
    await transaction.commit();
    
    res.redirect('/');

});

app.get('/formulario-aulas-qr', async (req, res) => {
  console.log('Got a GET in formulario-aulas-qr');
  //Añadir comprobaciones (Sesión iniciada, tiene clases en ese periodo, etc.)
  
  const sequelize = new Sequelize(db_config.name, db_config.user, db_config.password, { dialect: db_config.dialect, host: db_config.host, port: db_config.port});

  try {
    await sequelize.authenticate();
    console.log('Connection successful.');
  }
  catch (error) {
    console.error('Unable to connect:', error);
    res(500, "Something went wrong");
    return;
  }
  
  const espacio = Espacio.model(sequelize, DataTypes);

  await espacio.sync();
  
  console.log('Searching in Espacio for numero, tipo, edificio');
  const query_esp_all = await espacio.findAll({
    attributes:['numero', 'tipo', 'edificio'],
    order: [['edificio'], ['tipo'], ['numero']]
  });

  let espacios_todos = [];
  let edifx = null;
  query_esp_all.forEach((esp) => {
    if (esp.dataValues.edificio != edifx) {
      edifx = esp.dataValues.edificio;
      espacios_todos.push({ edificio: edifx, espacios: []});
    }
    espacios_todos[espacios_todos.length - 1].espacios.push(esp.dataValues);
  });

  // Todos los espacios
  res.render('formulario-aulas', { espacios: espacios_todos, all: true });

});

app.post('/formulario-aulas-qr', (req, res) => {
  console.log(`Got a POST in formulario-aulas-qr with ${JSON.stringify(req.body)}`);
  res.redirect(`/formulario-end-qr/?espacio=${req.body.espacio}`);
});

app.get('/formulario-end-qr', (req, res) => { //NO CARGA EL QR
  console.log('Got a GET in formulario-end-qr');
  res.sendFile(path.join(staticname, '/formulario-end-qr.html'));
});

app.post('/formulario-end-qr', (req, res) => { //NO CARGA EL QR
  console.log(`Got a POST in formulario-end-qr with ${JSON.stringify(req.body)}`);
  res.sendFile(path.join(staticname, '/formulario-end-qr.html'));
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

app.get('/anular-clase', (req, res) => {
  console.log(req.query);
  
  res.render('anular-clase', {fecha: moment().format('YYYY-MM-DDTHH:MM')} );
});

app.post('/anular-clase', async (req, res) => {
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
    es_todo_el_día: 'No', creado_por: sesion.nombre
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
function checkSesion(res, emmitter) {
  if (sesion == null) {
    toRedirect = emmitter;
    res.redirect('/login');
    return false;
  }
  return true;
}

