const messaging = require('../../messaging');
const moment = require('moment');
const recurrence_tool = require('../../utils/recurrence_tool');
const getOffsetString = require('../../utils/offset_string');
// Para cancelar una clase, establecemos un límite de las actividades a cargar (pues pueden ser infinitas)
const MAX_separacion_actividades = { unidad: 'months', cantidad: 1 };

async function anularClase(req, res) {

  let [actividad_id, hora_inicio,, hora_fin] = req.body.clase_filter.split(' ', 4);
  
  const actividad = await messaging.getFromApi(`/actividades/${actividad_id}`, res, true);

  const offsetString = getOffsetString(req.session.user.offset);

  const data_excepcion = {actividad_id: actividad.id, esta_cancelado: 'Sí', 
    fecha_inicio_act: moment(req.body.meeting_time + ' ' + hora_inicio + ':00' + offsetString).utc().format("YYYY-MM-DD HH:mm:00"), 
    fecha_fin_act: moment(req.body.meeting_time + ' ' + hora_fin + ':00' + offsetString).utc().format("YYYY-MM-DD HH:mm:00"),
    es_todo_el_día: actividad.es_todo_el_dia, creado_por: req.session.user.id
  };

  // Creamos la excepción con la cancelación
  await messaging.sendToApiJSON(data_excepcion, '/excepciones', res, true);

  const espacio_ids = (await messaging.getFromApi(`/espacios/actividades/${actividad_id}`, res, true)).espacios;

  const data_asist = {
    tipo_registro: 'RegistroSeguimientoFormulario',
    usuarioId: req.session.user.id,
    espacioId: espacio_ids[0].id,
    motivo: req.body.motivo,
    fecha: moment(req.body.meeting_time + ' ' + hora_inicio + ':00' + offsetString).utc().format("YYYY-MM-DD HH:mm:00[Z]"),
    estado: 'No Asistida'
  }

  // Añadimos la no asistencia con el motivo indicado
  await messaging.sendToApiJSON(data_asist, '/seguimiento', res, true);

  res.render('exito', {mensaje: 'Clase anulada con exito'});
}

async function getClases(req, res) {

  let fechayhora = moment.now();
  let max_fecha = moment(fechayhora).clone().utc().add(MAX_separacion_actividades.cantidad, MAX_separacion_actividades.unidad);
  fechayhora = moment(fechayhora).utc();

  const actividades = (await messaging.getFromApi(`/actividades/usuarios/${req.session.user.id}`, res, true)).actividades;

  let resultado = [];
  let actividades_data = [];
  for (let i = 0; i < actividades.length; i++) {
    const act = actividades[i];
    actividades_data.push(await messaging.getFromApi(`/actividades/${act.id}`, res, true));
    const act_data = actividades_data[i];

    // Si es recurrente solo la añadimos si no tiene fin o la recurrencia acaba después de ahora, y no empieza antes del máximo permitido
    if (actividades_data[i].es_recurrente == 'Sí' && (actividades_data[i].fecha_fin == null || moment(actividades_data[i].fecha_fin + 'Z').utc() >= fechayhora)
      && (moment(actividades_data[i].fecha_inicio + 'Z').utc() <= max_fecha)) {
        let recurrencias = (await messaging.getFromApi(`/recurrencias/actividades/${act.id}`)).recurrencias;
        
        let instancias_recurrencias = [];
        // Construir recurrencias hasta maximo o fecha_fin
        act_data.fecha_inicio = strMax(fechayhora.format('YYYY-MM-DD 00:00:00.000'), act_data.fecha_inicio);
        act_data.fecha_fin = (act_data.fecha_min == null) ? max_fecha.format('YYYY-MM-DD 00:00:00.000') :
         strMin(max_fecha.format('YYYY-MM-DD 00:00:00.000'), act_data.fecha_fin);

        // Conseguimos las recurrencias de la actividad
        for (let j = 0; j < recurrencias.length; j++) { 
          const recurrencia_data = await messaging.getFromApi(`/recurrencias/${recurrencias[j].id}`, res, true);
          instancias_recurrencias.push(recurrence_tool.fechaFromActividadRecurrencia(act_data, recurrencia_data));
        }

        // Conseguimos las excepciones de la actividad
        const excepciones_ids = (await messaging.getFromApi(`/excepciones/actividades/${act.id}`, res, true)).excepciones;
        let canceladas = [];
        let reprogramadas = [];
        for (let j = 0; j < excepciones_ids.length; j++) {
          let ex = await messaging.getFromApi(`/excepciones/${excepciones_ids[j].id}`, res, true)
          if (ex.esta_reprogramado == 'Sí') {
            // Actividades reprogramadas, no canceladas, dentro del periodo de búsqueda
            if (ex.esta_cancelado == 'No' && fechayhora.format('YYYY-MM-DD HH:mm:00') <= ex.fecha_inicio_ex && max_fecha.format('YYYY-MM-DD HH:mm:00') >= ex.fecha_inicio_ex) {
              reprogramadas.push(ex);
            }
          }
          else if (ex.esta_cancelado == 'Sí') { // Actividades canceladas, no incluyendo las cancelaciones de las reprogramaciones
            canceladas.push(ex);
          }
        }
        
        // Recorremos las clases de la actividad
        for (let j = 0; j < actividades_data[i].clase_ids.length; j++) {
          const clase_id = act_data.clase_ids[j].id;
          // Para cada clase de la actividad conseguimos la información de la clase
          const clase_data = await messaging.getFromApi(`/clases/${clase_id}`, res, true);

          const asig_data = await messaging.getFromApi(`/asignaturas/${clase_data.asignatura_id}`, res, true);
          const grupo_data = await messaging.getFromApi(`/grupos/${clase_data.grupo_id}`, res, true);

          reprogramadas.forEach((ex) => {
           
            let mmt_inicio_ex = moment(ex.fecha_inicio_ex + 'Z', "YYYY-MM-DD HH:mm:00Z").utcOffset(req.session.user.offset);
            let mmt_fin_ex = moment(ex.fecha_fin_ex + 'Z', "YYYY-MM-DD HH:mm:00Z").utcOffset(req.session.user.offset);

            // Añadimos el resultado
            resultado.push({id: act.id, nombre: mmt_inicio_ex.format('HH:mm') + ' - ' + mmt_fin_ex.format('HH:mm') + ' | ' 
            + asig_data.nombre + " " + grupo_data.curso + "º" + grupo_data.letra, fecha: mmt_inicio_ex.format('YYYY-MM-DD') });
          });

          // Recorremos las diferentes fechas para cada recurrencia 
          instancias_recurrencias.forEach((fechas) => {
            fechas.forEach((instancia) => {
              // Comprobamos las excepciones para esta fecha
              let cancelada = false;
              for (let k = 0; k < canceladas.length; k++) {
                let ex = canceladas[k];
                
                if (moment(instancia.inicio, 'YYYY-MM-DDTHH:mm:00Z').utc().format('YYYY-MM-DD HH:mm:00') == ex.fecha_inicio_act && moment(instancia.fin, 'YYYY-MM-DDTHH:mm:00Z').utc().format('YYYY-MM-DD HH:mm:00') == ex.fecha_fin_act) {
                  cancelada = true;
                  break;
                }
              }

              // Añadimos el resultado si no se ha cancelado
              if (!cancelada) {
                const inicio = moment(instancia.inicio).utcOffset(req.session.user.offset);
                resultado.push({id: act.id, nombre: inicio.format('HH:mm') + ' - ' 
                  + moment(instancia.fin).utcOffset(req.session.user.offset).format('HH:mm') + ' | ' + asig_data.nombre + " " + grupo_data.curso + 
                  "º" + grupo_data.letra, fecha: inicio.format('YYYY-MM-DD') });
              }
            });
          });
        }
    } // Si no es recurrente, solo la añadimos si se realiza después de ahora
    else if (actividades_data[i].es_recurrente == 'No' && ((moment(actividades_data[i].fecha_inicio + 'Z').utc().format('DD/MM/YYYY') == fechayhora.format('DD/MM/YYYY') && 
      moment(actividades_data[i].tiempo_inicio + 'Z').format('HH:mm') > fechayhora.format('HH:mm')) || moment(actividades_data[i].fecha_inicio + 'Z').utc().format('DD/MM/YYYY') > fechayhora.format('DD/MM/YYYY'))) {
        for (let j = 0; j < actividades_data[i].clase_ids.length; j++) {
          const clase_id = actividades_data[i].clase_ids[j].id;
          const clase_data = await messaging.getFromApi(`/clases/${clase_id}`, res, true);

          const asig_data = await messaging.getFromApi(`/asignaturas/${clase_data.asignatura_id}`, res, true);
          const grupo_data = await messaging.getFromApi(`/grupos/${clase_data.grupo_id}`, res, true);

          resultado.push({id: act.id, nombre: moment(actividades_data[i].tiempo_inicio).utcOffset(req.session.user.offset).format("HH:mm") + ' - ' 
                          + moment(actividades_data[i].tiempo_fin).utcOffset(req.session.user.offset).format("HH:mm") + ' | ' + 
                          asig_data.nombre + " " + grupo_data.curso + "º" + grupo_data.letra, 
                          fecha: moment(actividades_data[i].fecha_inicio + 'Z').utcOffset(req.session.user.offset).format('YYYY-MM-DD')});
        }
    }
  }

  res.render('anular-clase', {
    clases: resultado, 
    fecha: {hoy: fechayhora.utcOffset(req.session.user.offset).format('YYYY-MM-DD'), 
    max: max_fecha.utcOffset(req.session.user.offset).format('YYYY-MM-DD')}, 
    usuario: {rol: req.session.user.rol, 
      nombre: req.session.user.nombre, 
      apellidos: req.session.user.apellidos
    }
  });
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