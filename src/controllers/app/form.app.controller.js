const messaging = require('../../messaging');
const moment = require('moment');
const recurrence_tool = require('../../parse_fecha.js');
const valoresAsistencia = ['Asistida', 'Asistida con Irregularidad', 'No Asistida'];

async function getEspaciosPosibles(req, res) {

  let data = {};

  if (req.query.all == 'yes') {
    req.session.user.estado = valoresAsistencia[1];
    data.opcion = "espacios_irregularidad";
  }
  else {
    req.session.user.estado = valoresAsistencia[0];
    data.opcion = "espacios_rutina";
  }

  let espacios_doc = [];

  const id_sesion = (req.session.user.id).toString();
  const api_path = `/espacios/usuarios/${id_sesion}`;
  let espacios_ids = (await messaging.sendToApiJSON(data, api_path, res, false)).espacios;

  if (espacios_ids.length > 0) {
    let espacios_data = [];
    for (let i = 0; i < espacios_ids.length; i++) {
      const id_esp = (espacios_ids[i].id).toString();
      const api_esp_path = `/espacios/${id_esp}`;
      console.log(api_esp_path);
      espacios_data.push((await messaging.getFromApi(api_esp_path, res, false)));
    }

    //Sacamos un array separando los espacios por edificio ([{ edificio, espacios }, { edificio, espacios }, ...])
    let edif = null;
    espacios_data.forEach((esp) => {
      if (esp.edificio != edif) {
        edif = esp.edificio;
        espacios_doc.push({ edificio: edif, espacios: []});
      }
      espacios_doc[espacios_doc.length - 1].espacios.push({ id: esp.id, nombre: esp.nombre });
    });
  }
  else {
    res.redirect('/formulario-aulas/?all=yes');
    return;
  }

  //Enseñamos únicamente los espacios que coincidan con las actividades
  res.render('formulario-aulas', { espacios: espacios_doc, all: (req.query.all == 'yes'), usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos} });
  return;
}

async function getAllEspacios(req, res) {
  let query_esp_all = await messaging.getFromApi('/espacios', res, true);

  let espacios_todos = [];
  let edifx = null;
  query_esp_all.forEach((esp) => {
    if (esp.edificio != edifx) {
      edifx = esp.edificio;
      espacios_todos.push({ edificio: edifx, espacios: []});
    }
    espacios_todos[espacios_todos.length - 1].espacios.push(esp);
  });
  
  // Todos los espacios
  res.render('formulario-aulas', { espacios: espacios_todos, all: true, usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}});
}

function confirmEspacioPosible(req, res) {
  if (req.body.espacio == "Otro") {
      res.redirect('/formulario-aulas/?all=yes');
  }
  else {
      res.redirect(`/formulario-end/?espacioId=${req.body.espacio}`);
  }
  return;
}

async function getForm(req, res) {
  let esp = '';
  let totp = '';
  if (Object.keys(req.query).length != 0) {
    if (req.query.espacioId) {
      esp = req.query.espacioId;
      req.session.user.espacio_id = parseInt(esp);
    }
    if (req.query.totp) totp = req.query.totp;
    req.session.save();
  }

  let irregularidad = (req.session.user.estado == valoresAsistencia[1]);

  const currentHour = moment().format('HH:mm'); //Cambiar la hora para probar aquí (ejemplo "16:30")
  const esp_data = (await messaging.getFromApi(`/espacios/${esp}`, res, true));

  // query a base de datos para conseguir asignatura y grupo que sería
  const id_sesion = (req.session.user.id).toString();
  const api_path_act_us = `/actividades/usuarios/${id_sesion}`;
  let actividades_ids_us = (await messaging.getFromApi(api_path_act_us, res, true)).actividades;
  const api_path_act_esp = `/actividades/espacios/${esp}`;
  let actividades_ids_esp = (await messaging.getFromApi(api_path_act_esp, res, true)).actividades;

  let actividad_ids_irregularidad = [];
  let actividades_esp_aparicion = [];
  let actividades_ids = actividades_ids_us.filter(x => {
    for(let i = 0; i < actividades_ids_esp.length; i++) {
      if (x.id == actividades_ids_esp[i].id) {
        actividades_esp_aparicion[i] = true;
        return true;
      }
    }
    actividad_ids_irregularidad.push(x);
    return false;
  });
  console.log(actividades_ids);
  console.log(actividad_ids_irregularidad);
  
  //Comprobamos que estén en la franja horaria actual
  let actividades_posibles = await getActividadesPosibles(res, currentHour, actividades_ids);

  //Si no hay ninguna, estamos ante una irregularidad => mostramos todas las del docente en este momento, y las del espacio en este momento
  if (actividades_posibles == 0) {
    for (let i = 0; i < actividades_ids_esp.length; i++) {
      if (!actividades_esp_aparicion[i]) {
        actividad_ids_irregularidad.push(actividades_ids_esp[i]);
      }
    }
    
    actividades_posibles = await getActividadesPosibles(res, currentHour, actividad_ids_irregularidad);
  }

  if (actividades_posibles.length != 0) { 

    let clases_data = [];
    for (let i = 0; i < actividades_posibles.length; i++) {
      for (let j = 0; j < actividades_posibles[i].clase_ids.length; j++) {
        const id_cl = (actividades_posibles[i].clase_ids[j].id).toString();
        const api_cl_path = `/clases/${id_cl}`;
        clases_data.push((await messaging.getFromApi(api_cl_path, res, true)));
      }
    }

    let clases_info = [];
    for (let i = 0; i < clases_data.length; i++) {
      const id_asig = (clases_data[i].asignatura_id).toString();
      const api_asig_path = `/asignaturas/${id_asig}`;
      const id_gr = (clases_data[i].grupo_id).toString();
      const api_gr_path = `/grupos/${id_gr}`;
      clases_info.push({grupo: (await messaging.getFromApi(api_gr_path, res, true)), asignatura: (await messaging.getFromApi(api_asig_path, res, true)) });
    }

    let resultado = {espacio: esp_data.nombre + " " + esp_data.edificio, totp: totp,
                     hora: `${moment(currentHour, 'HH:mm').format('HH:mm')}`, clases: [] 
                     // clases = [ { asignatura: , grupo: } ]
    };

    clases_info.forEach((clase) => {
      const str_asig = clase.asignatura.nombre + " (" + clase.asignatura.siglas + ")";
      const str_grupo = clase.grupo.curso + "º" + clase.grupo.letra;

      resultado.clases.push({asignatura: str_asig, grupo: str_grupo});
    });
    console.log('RESULTADO', resultado);
      
    res.render('formulario-end', { resultado: resultado, usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}, irregularidad: irregularidad });
    return;
  }
  else {
    res.render('formulario-end', { resultado: {espacio: esp_data.nombre + " " + esp_data.edificio, totp: totp, 
                                  hora: `${moment(currentHour, 'HH:mm').format('HH:mm')}`, clases: []}, 
                                  usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}, irregularidad: irregularidad });
  }
}

async function postForm(req, res) {
  const espacio_id = req.session.user.espacio_id;
  let state = req.session.user.estado;
  let motivo_asist = null;
  if (req.body.sustitucion) { motivo_asist = "Sustitución"; }
  if (req.body.claseMov) { (motivo_asist != null) ? motivo_asist += ", Cambio de Aula" : motivo_asist = "Cambio de Aula"; }
  

  let data = {
    tipo_registro: "RegistroSeguimientoFormulario",
    espacioId: espacio_id,
    usuarioId: req.session.user.id,
    estado: state,
    motivo: motivo_asist
  };

  if (req.body.totp) {
    data.tipo_registro = "RegistroSeguimientoUsuario";
    data.totp = req.body.totp;
  }
  
  console.log(data);
  try {
    await messaging.sendToApiJSON(data, '/seguimiento', res, false);
  }
  catch(error) {
    let redo = {
      usuario: req.body.docente, 
      espacio: req.body.espacio, totp: req.body.totp, 
      hora: `${moment().format('HH:mm')}`, 
      clases: JSON.parse(req.body.clases),
      error: "Datos no válidos"
    }
    res.render('formulario-end', {resultado: redo, usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}, irregularidad: state == valoresAsistencia[1]});
    return;
  }
  
  res.render('exito', {mensaje: "Asistencia registrada con éxito"});
}

module.exports = {
  getEspaciosPosibles, getAllEspacios, confirmEspacioPosible, getForm, postForm 
}

async function getActividadesPosibles(res, currentHour, actividades_ids) {
  
  let actividades_data = [];
  for (let i = 0; i < actividades_ids.length; i++) {
    const id_act = (actividades_ids[i].id).toString();
    const api_act_path = `/actividades/${id_act}`;
    actividades_data.push({id: id_act, data: (await messaging.getFromApi(api_act_path, res, true))});
  }
  
  let actividades_posibles = [];
  for (let i = 0; i < actividades_data.length; i++) {
    let act = actividades_data[i];
    const inicio = moment(act.data.tiempo_inicio, 'HH:mm');
    const fin = moment(act.data.tiempo_fin, 'HH:mm');
    if (inicio.format('HH:mm') <= currentHour && currentHour <= fin.format('HH:mm')) {
      let act_rec = (await messaging.getFromApi(`/recurrencias/actividades/${act.id}`, res, true)).recurrencias;
      //TODO tener en cuenta reprogramaciones
      //Comprobamos que su recurrencia caiga en la fecha actual
      for (let j = 0; j < act_rec.length; j++) {
        let rec_data = await messaging.getFromApi(`/recurrencias/${act_rec[j].id}`, res, true);
        let hoy_hora_inicio = moment(moment.now()).hours(inicio.hours()).minutes(inicio.minutes());

        if (recurrence_tool.isInRecurrencia(act.data, rec_data, hoy_hora_inicio)) {
          
          //Comprobamos que no está en una instancia de recurrencia cancelada
          const excepcion_ids = (await messaging.getFromApi(`/excepciones/actividades/${act.id}`, res, true)).excepciones;
          let cancelada = false;

          for (let k = 0; k < excepcion_ids.length && !cancelada; k++) {
            let exc = await messaging.getFromApi(`/excepciones/${excepcion_ids[k].id}`, res, true);

            cancelada = (exc.esta_cancelado == 'Sí' && moment(exc.fecha_inicio_act).format('DD/MM/YYYY HH:mm') == hoy_hora_inicio);
          }

          if (!cancelada) {
            actividades_posibles.push(act.data);
            break;
          }
        }
      }
    }
  }

  return actividades_posibles;
} 