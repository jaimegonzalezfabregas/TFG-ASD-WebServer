const messaging = require('../../messaging');
const moment = require('moment');
const recurrence_parser = require('../../parse_fecha');

async function anularClase(req, res) {

  console.log(req.body.clase_filter);
  const actividad = await messaging.getFromApi(`/actividades/clases/${req.body.clase_filter}`);

  const data_excepcion = {actividad_id: actividad.dataValues.id, esta_reprogramado: 'No', esta_cancelado: 'Sí', 
    fecha_inicio: actividad.dataValues.fecha_inicio, fecha_fin: actividad.dataValues.fecha_fin, 
    tiempo_inicio: actividad.dataValues.tiempo_inicio, tiempo_fin: actividad.dataValues.tiempo_fin, 
    es_todo_el_día: actividad.dataValues.es_todo_el_día, creado_por: req.session.user.nombre
  };

  const respuesta = await messaging.sendToApiJSON(data_excepcion, '/excepciones', res, true);

  //Camino para que dada una actividad genere una excepción {actividad_id:, nuevo_tiempo_inicio:, nuevo_tiempo_fin:} ¿Cómo se movería del Lunes al Miércoles de la misma hora?
  //El camino de la excepción también debería generar una asistencia de No Asistida, con un motivo?

  res.render('exito', {mensaje: 'Clase anulada con exito'});
}

async function getClases(req, res, fecha) {

  const actividades = (await messaging.getFromApi(`/actividades/usuarios/${req.session.user.id}`, res, true)).actividades;

  let actividades_data = [];
  let clases_data = [];
  for (let i = 0; i < actividades.length; i++) {
    const act = actividades[i];
    actividades_data.push(await messaging.getFromApi(`/actividades/${act.id}`, res, true));

    let in_rec = false;
    if (actividades_data[i].es_recurrente == 'Si' && actividades_data[i].fecha_inicio <= fecha && actividades_data[i].fecha_fin >= fecha
      && actividades_data[i].hora_inicio <= hora && actividades_data[i].hora_fin >= hora) {
      let recurrencia = await messaging.getFromApi(`/recurrencias/actividades/${act.id}`);
      in_rec = recurrence_parser.isInRecurrencia(actividades_data[i], recurrencia);
    } 

    if (in_rec || actividades_data[i].fecha_inicio == fecha) { //Es recurrente y coincide, o no es recurrente, pero está en fecha
      for (let j = 0; j < actividades_data[i].clase_ids.length; j++) {
        const clase_id = actividades_data[i].clase_ids[j].id;
        const clase_data = await messaging.getFromApi(`/clases/${clase_id}`, res, true);

        const asig_data = await messaging.getFromApi(`/asignaturas/${clase_data.asignatura_id}`, res, true);
        const grupo_data = await messaging.getFromApi(`/grupos/${clase_data.grupo_id}`, res, true);

        clases_data.push({id: clase_id, asignatura: asig_data, grupo: grupo_data});
      }
    }
  }

  let resultado = [];
  clases_data.forEach((data) => {
    resultado.push({id: data.id, nombre: data.asignatura.nombre + " " + data.grupo.curso + "º" + data.grupo.letra});
  });

  res.render('anular-clase', {clases: resultado, fecha: moment().format('YYYY-MM-DDTHH:MM'), usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}} );
}

module.exports = {
  anularClase, getClases
}