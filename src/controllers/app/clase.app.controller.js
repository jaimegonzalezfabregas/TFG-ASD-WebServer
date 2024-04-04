const messaging = require('../../messaging');
const moment = require('moment');
const recurrence_tool = require('../../parse_fecha');
// Para cancelar una clase, establecemos un límite de las actividades a cargar (pues pueden ser infinitas)
const MAX_separacion_actividades = { unidad: 'months', cantidad: 3 };

async function anularClase(req, res) {

  let [clase_id, hora_inicio,, hora_fin] = req.body.clase_filter.split(' ', 4);
  
  //Mirar la línea de abajo y sus implicaciones más a fondo (asume que una clase tiene una sola actividad?)
  const actividad_id = (await messaging.getFromApi(`/actividades/clases/${clase_id}`, res, true)).actividades[0].id;
  const actividad = await messaging.getFromApi(`/actividades/${actividad_id}`, res, true);

  const data_excepcion = {actividad_id: actividad.id, esta_cancelado: 'Sí', 
    fecha_inicio_act: req.body.meeting_time + ' ' + hora_inicio + ':00', fecha_fin_act: req.body.meeting_time + ' ' + hora_fin + ':00',
    es_todo_el_día: actividad.es_todo_el_día, creado_por: req.session.user.nombre
  };

  // Creamos la excepción con la cancelación
  await messaging.sendToApiJSON(data_excepcion, '/excepciones', res, true);

  const espacio_ids = (await messaging.getFromApi(`/espacios/actividad/${actividad_id}`, res, true)).espacios;

  const data_asist = {
    tipo_registro: 'RegistroSeguimientoFormulario',
    usuarioId: req.session.user.id,
    espacioId: espacio_ids[0].id,
    motivo: req.body.motivo,
    fecha: req.body.meeting_time,
    estado: 'No Asistida'
  }

  // Añadimos la no asistencia con el motivo indicado
  await messaging.sendToApiJSON(data_asist, '/seguimiento', res, true);

  res.render('exito', {mensaje: 'Clase anulada con exito'});
}

async function getClases(req, res) {

  let fechayhora = moment.now();
  let max_fecha = moment(fechayhora).clone().add(MAX_separacion_actividades.cantidad, MAX_separacion_actividades.unidad);

  const actividades = (await messaging.getFromApi(`/actividades/usuarios/${req.session.user.id}`, res, true)).actividades;
  //TODO Mirar excepciones

  let resultado = [];
  let actividades_data = [];
  for (let i = 0; i < actividades.length; i++) {
    const act = actividades[i];
    actividades_data.push(await messaging.getFromApi(`/actividades/${act.id}`, res, true));
    const act_data = actividades_data[i];

    // Si es recurrente solo la añadimos si no tiene fin o la recurrencia acaba después de ahora, y no empieza antes del máximo permitido
    if (actividades_data[i].es_recurrente == 'Sí' && (actividades_data[i].fecha_fin == null || moment(actividades_data[i].fecha_fin) >= fechayhora)
      && (moment(actividades_data[i].fecha_inicio) <= max_fecha)) {
        let recurrencias = (await messaging.getFromApi(`/recurrencias/actividades/${act.id}`)).recurrencias;
        
        let instancias_recurrencias = [];
        // Construir recurrencias hasta maximo o fecha_fin
        act_data.fecha_inicio = strMax(moment(fechayhora).format('YYYY-MM-DD 00:00:00.000'), act_data.fecha_inicio);
        act_data.fecha_fin = (act_data.fecha_min == null) ? moment(max_fecha).format('YYYY-MM-DD 00:00:00.000') :
         strMin(moment(max_fecha).format('YYYY-MM-DD 00:00:00.000'), act_data.fecha_fin);

         console.log(recurrencias);
        for (let k = 0; k < recurrencias.length; k++) { 
          const recurrencia_data = await messaging.getFromApi(`/recurrencias/${recurrencias[k].id}`, res, true);
          instancias_recurrencias.push(recurrence_tool.fechaFromActividadRecurrencia(act_data, recurrencia_data));
        }

        console.log(instancias_recurrencias);
        console.log(act_data.fecha_inicio, act_data.fecha_fin);

        for (let j = 0; j < actividades_data[i].clase_ids.length; j++) {
          const clase_id = act_data.clase_ids[j].id;
          const clase_data = await messaging.getFromApi(`/clases/${clase_id}`, res, true);

          const asig_data = await messaging.getFromApi(`/asignaturas/${clase_data.asignatura_id}`, res, true);
          const grupo_data = await messaging.getFromApi(`/grupos/${clase_data.grupo_id}`, res, true);

          for (let k = 0; k < instancias_recurrencias.length; k++) {
            for (let l = 0; l < instancias_recurrencias[k].length; l++) {
              resultado.push({id: clase_id, nombre: moment(instancias_recurrencias[k][l].inicio).format('HH:mm') + ' - ' 
                + moment(instancias_recurrencias[k][l].fin).format('HH:mm') + ' | ' + asig_data.nombre + " " + grupo_data.curso + 
                "º" + grupo_data.letra, fecha: moment(instancias_recurrencias[k][l].inicio).format('YYYY-MM-DD') });
            }
          }
        }
    } // Si no es recurrente, solo la añadimos si se realiza después de ahora
    else if (actividades_data[i].es_recurrente == 'No' && ((moment(actividades_data[i].fecha_inicio).format('DD/MM/YYYY') == moment(fechayhora).format('DD/MM/YYYY') && 
      moment(actividades_data[i].tiempo_inicio).format('HH:mm') > moment(fechayhora).format('HH:mm')) || moment(actividades_data[i].fecha_inicio).format('DD/MM/YYYY') > moment(fechayhora).format('DD/MM/YYYY'))) {
        for (let j = 0; j < actividades_data[i].clase_ids.length; j++) {
          const clase_id = actividades_data[i].clase_ids[j].id;
          const clase_data = await messaging.getFromApi(`/clases/${clase_id}`, res, true);

          const asig_data = await messaging.getFromApi(`/asignaturas/${clase_data.asignatura_id}`, res, true);
          const grupo_data = await messaging.getFromApi(`/grupos/${clase_data.grupo_id}`, res, true);

          resultado.push({id: clase_id, nombre: actividades_data[i].tiempo_inicio + ' - ' + actividades_data[i].tiempo_fin + ' | ' + 
                          asig_data.nombre + " " + grupo_data.curso + "º" + grupo_data.letra, fecha: moment(actividades_data[i].fecha_inicio).format('YYYY-MM-DD')});
        }
    }
  }

  res.render('anular-clase', {clases: resultado, fecha: {hoy: moment(fechayhora).format('YYYY-MM-DD'), max: moment(max_fecha).format('YYYY-MM-DD')}, usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos}} );
}

function strMax(str1, str2) {
  if (str1 >= str2) return str1;
  else return str2;
}

function strMin(str1, str2) {
  if (str1 <= str2) return str1;
  else return str2;
}

module.exports = {
  anularClase, getClases
}