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
    const api_path = `/espacios/usuarios/${id_sesion}`;
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
      if (esp.edificio != edif) {
        edif = esp.edificio;
        espacios_doc.push({ edificio: edif, espacios: []});
      }
      espacios_doc[espacios_doc.length - 1].espacios.push({ id: esp.id, nombre: esp.nombre });
    });

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
    if (Object.keys(req.query).length != 0) {
      esp = req.query.espacio;
    }
    const currentHour = '16:30';//moment().format('HH:MM');
    const esp_data = (await messaging.getFromApi(`/espacios/${esp}`));

    // query a base de datos para conseguir asignatura y grupo que sería
    const id_sesion = (sesion.id).toString();
    const api_path_act_us = `/actividades/usuarios/${id_sesion}`;
    let actividades_ids_us = (await messaging.getFromApi(api_path_act_us)).actividades;
    const api_path_act_esp = `/actividades/espacios/${esp}`;
    let actividades_ids_esp = (await messaging.getFromApi(api_path_act_esp)).actividades;

    let actividades_ids = actividades_ids_us.filter(x => {
      for(let i = 0; i < actividades_ids_esp.length; i++) {
        if (x.id == actividades_ids_esp[i].id) {
          return true;
        }
      }
      return false;
    });

    console.log(actividades_ids);

    let actividades_data = [];
    for (let i = 0; i < actividades_ids.length; i++) {
      const id_act = (actividades_ids[i].id).toString();
      const api_act_path = `/actividades/${id_act}`;
      console.log(api_act_path);
      actividades_data.push((await messaging.getFromApi(api_act_path)));
    }

    //Comprobamos que estén en la franja horaria actual
    let actividades_posibles = [];
    actividades_data.forEach((act) => {
      if (act.tiempo_inicio <= currentHour && currentHour <= act.tiempo_fin) {
        actividades_posibles.push(act);
      }
    });

    if (actividades_posibles.length != 0) {

      let clases_data = [];
      for (let i = 0; i < actividades_posibles.length; i++) {
        for (let j = 0; j < actividades_posibles[i].clase_ids.length; j++) {
          const id_cl = (actividades_posibles[i].clase_ids[j].id).toString();
          const api_cl_path = `/clases/${id_cl}`;
          clases_data.push((await messaging.getFromApi(api_cl_path)));
          console.log(clases_data[j]);
        }
      }

      let clases_info = [];
      for (let i = 0; i < clases_data.length; i++) {
        const id_asig = (clases_data[i].asignatura_id).toString();
        const api_asig_path = `/asignaturas/${id_asig}`;
        const id_gr = (clases_data[i].grupo_id).toString();
        const api_gr_path = `/grupos/${id_gr}`;
        clases_info.push({grupo: (await messaging.getFromApi(api_gr_path)), asignatura: (await messaging.getFromApi(api_asig_path)) });
      }

      let resultado = {usuario: sesion.nombre + " " + sesion.apellidos, 
                       espacio: { id: esp, nombre: esp_data.nombre + " " + esp_data.edificio },
                       hora: `${currentHour}`, clases: [], actividad_ids: actividades_ids 
                       // clases = [ { asignatura: , grupo: } ]
      };

      clases_info.forEach((clase) => {
        const str_asig = clase.asignatura.nombre + " (" + clase.asignatura.siglas + ")";
        const str_grupo = clase.grupo.curso + "º" + clase.grupo.letra;

        resultado.clases.push({asignatura: str_asig, grupo: str_grupo});
        
      });
      
      console.log(resultado);
      res.render('formulario-end', resultado);
      return;
    }
    else {
      res.render('formulario-end', {usuario: sesion.nombre + " " + sesion.apellidos, 
                                    espacio: {id: esp, nombre: esp_data.nombre + " " + esp_data.edificio }, 
                                    hora: `${currentHour}`, clases: [], actividad_ids: [] });
    }
  }
});

app.post('/formulario-end', async (req, res) => {
    console.log(JSON.stringify(req.body));
    // query a base de datos para conseguir asignatura y grupo que sería

    const espacio_id = req.body.espacioId;

    const actividades_ids = JSON.parse(req.body.actividad_ids)
  
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

