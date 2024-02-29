const messaging = require('../../messaging');
const moment = require('moment');

async function getEspaciosPosibles(req, res) {
  let data = { 
    opcion: (req.query.all != 'yes') ? "espacios_rutina" : "espacios_irregularidad"
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
  res.render('formulario-aulas', { espacios: espacios_doc, all: (req.query.all == 'yes') });
  return;
}

async function getAllEspacios(req, res) {
  let query_esp_all = await messaging.getFromApi('/espacios', res, true);

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

  const currentHour = moment('16:30', 'HH:mm'); //moment().format('hh:mm');
  const esp_data = (await messaging.getFromApi(`/espacios/${esp}`, res, true));

  // query a base de datos para conseguir asignatura y grupo que sería
  const id_sesion = (req.session.user.id).toString();
  const api_path_act_us = `/actividades/usuarios/${id_sesion}`;
  let actividades_ids_us = (await messaging.getFromApi(api_path_act_us, res, true)).actividades;
  const api_path_act_esp = `/actividades/espacios/${esp}`;
  let actividades_ids_esp = (await messaging.getFromApi(api_path_act_esp, res, true)).actividades;

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
    actividades_data.push({id: id_act, data: (await messaging.getFromApi(api_act_path, res, true))});
  }

  req.session.user.actividades_ids = [];

  //Comprobamos que estén en la franja horaria actual
  let actividades_posibles = [];
  actividades_data.forEach((act) => {
    const inicio = moment(act.data.tiempo_inicio, 'HH:mm');
    const fin = moment(act.data.tiempo_fin, 'HH:mm');
    console.log(inicio, fin, currentHour, inicio <= currentHour, fin >= currentHour);
    if (inicio <= currentHour && currentHour <= fin) {
      actividades_posibles.push(act.data);
      req.session.user.actividades_ids.push(act.id);
      console.log(act);
    }
  });

  console.log(req.session.user.actividades_ids, actividades_posibles.length, actividades_posibles);

  if (actividades_posibles.length != 0) { 

    let clases_data = [];
    for (let i = 0; i < actividades_posibles.length; i++) {
      for (let j = 0; j < actividades_posibles[i].clase_ids.length; j++) {
        const id_cl = (actividades_posibles[i].clase_ids[j].id).toString();
        const api_cl_path = `/clases/${id_cl}`;
        clases_data.push((await messaging.getFromApi(api_cl_path, res, true)));
        console.log(clases_data[j]);
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

    let resultado = {usuario: req.session.user.nombre + " " + req.session.user.apellidos, 
                     espacio: esp_data.nombre + " " + esp_data.edificio, totp: totp,
                     hora: `${moment(currentHour.toString()).format('HH:mm')}`, clases: [] 
                     // clases = [ { asignatura: , grupo: } ]
    };

    console.log(currentHour.toString(), moment(currentHour.toString()).format('HH:mm'));

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
    res.render('formulario-end', {usuario: req.session.user.nombre + " " + req.session.user.apellidos, 
                                  espacio: esp_data.nombre + " " + esp_data.edificio, totp: totp, 
                                  hora: `${moment(currentHour.toString()).format('HH:mm')}`, clases: [] });
  }
}

async function postForm(req, res) {
  const espacio_id = req.session.user.espacio_id;
  const actividades_ids = req.session.user.actividades_ids;
  let state = 'Asistida con Irregularidad';

  if (actividades_ids.length != 0) {
    state = 'Asistida'; 
  }

  let data = {
    tipo_registro: "RegistroSeguimientoFormulario",
    espacioId: espacio_id,
    usuarioId: req.session.user.id,
    estado: state
  }

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
    res.render('formulario-end', redo);
    return;
  }
  
  res.render('exito', {mensaje: "Asistencia registrada con éxito"});
}

module.exports = {
  getEspaciosPosibles, getAllEspacios, confirmEspacioPosible, getForm, postForm 
}