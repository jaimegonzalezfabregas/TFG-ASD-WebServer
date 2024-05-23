require('dotenv').config();
const logger = require('../../config/logger.config').child({"process": "server"});
const mailer = require('../../config/mail.config');
const server_config = require('../../config/server.config');

const messaging = require('../../messaging');
const recurrence_tool = require('../../utils/recurrence_tool');
const moment = require('moment');

async function getAJustificar(req, res) {

    const data = {
        estado: 'No Asistida',
        motivo: 'No'
    }

    // Sacamos de la base de datos todas las asistencias no justificadas (no asistidas y sin motivo)
    const noJustificadas = (await messaging.sendToApiJSON(data, '/seguimiento/asistencias', res, true)).asistencias;

    req.session.user.no_justificadas = [];
    let resultado = [];
    let pos = 0;
    for(let i = 0; i < noJustificadas.length; i++) {
        let asistencia = noJustificadas[i];
        let asistencia_info = await messaging.getFromApi(`/seguimiento/asistencias/${asistencia.id}`, res, true);

        if (asistencia_info.docenteId == req.session.user.id) {
            // Sacar actividades de este docente en el espacio
            let actividades_ids_docente = (await messaging.getFromApi(`/actividades/usuarios/${asistencia_info.docenteId}`, res, true)).actividades;
            let actividades_ids_espacio = (await messaging.getFromApi(`/actividades/espacios/${asistencia_info.espacioId}`, res, true)).actividades;

            let actividades_ids = actividades_ids_docente.filter(x => {
                for(let j = 0; j < actividades_ids_espacio.length; j++) {
                  if (x.id == actividades_ids_espacio[j].id) {
                    return true;
                  }
                }
                return false;
            });

            for (let j = 0; j < actividades_ids.length; j++) {

                let actividad_id = actividades_ids[j];
                let actividad = await messaging.getFromApi(`/actividades/${actividad_id.id}`, res, true);

                let encontrada = false;
                if (actividad.es_recurrente == 'Sí') {
                    let recurrencias_actividad = (await messaging.getFromApi(`/recurrencias/actividades/${actividad_id.id}`, res, true)).recurrencias;

                    for (let k = 0; k < recurrencias_actividad.length; k++) {
                        let recurrencia = await messaging.getFromApi(`/recurrencias/${recurrencias_actividad[k].id}`, res, true);
                        
                        // Si una recurrencia encaja con la fecha de la asistencia, tenemos lo que buscamos, nos saltamos el resto
                        if (recurrence_tool.isInRecurrencia(actividad, recurrencia, asistencia_info.fecha)) {
                            encontrada = true;
                            break;
                        }
                    }
                }
                else {
                    let mmt_inicio = moment(actividad.tiempo_inicio, 'HH:mm');
                    if (moment(actividad.fecha_inicio + 'Z', 'YYYY-MM-DD HH:mm:00Z').hours(mmt_inicio.hours()).minutes(mmt_inicio.minutes()).format('YYYY-MM-DD HH:mm') == moment(asistencia_info.fecha + 'Z', 'YYYY-MM-DD HH:mm:00Z').format('YYYY-MM-DD HH:mm')) {
                        encontrada = true;
                    }
                }

                // Al no haberla encontrado, miramos si es no asistida de una reprogramación
                if (!encontrada) {
                    let excepciones_ids = (await messaging.getFromApi(`/excepciones/actividades/${actividad.id}`, res, true)).excepciones;

                    for (let k = 0; k < excepciones_ids.length; k++) {
                        let excepcion = await messaging.getFromApi(`/excepciones/${excepciones_ids[k].id}`);
                        
                        // Hay una reprogamación no cancelada de esa actividad para el día de la no asistencia
                        if (excepcion.esta_reprogramada == 'Sí' && excepcion.esta_cancelada == 'No' && 
                            excepcion.fecha_inicio_ex == asistencia_info.fecha) {
                            encontrada = true;
                            break;
                        }
                    }
                }
                
                if (encontrada) {
                    let clase_strings = [];
                    for(let k = 0; k < actividad.clase_ids.length; k++) {
                        let clase_info = await messaging.getFromApi(`/clases/${actividad.clase_ids[k].id}`, res, true);
                        let grupo_info = await messaging.getFromApi(`/grupos/${clase_info.grupo_id}`, res, true);
                        let asignatura_info = await messaging.getFromApi(`/asignaturas/${clase_info.asignatura_id}`, res, true);

                        clase_strings.push(`${asignatura_info.nombre} ${grupo_info.curso}º${grupo_info.letra}`);
                    }

                    resultado.push({fechayhora: asistencia_info.fecha, clase: clase_strings, pos: pos});
                    pos++;
                    req.session.user.no_justificadas.push(asistencia.id);
                    
                    break;
                }
            }
        }
    }

    logger.info(JSON.stringify(resultado));

    return resultado;
}

async function justificar(req, res) {
    let motivo = null;
    switch(req.body.motivo) {
        case "olvido": motivo = "Olvidé firmar"; break;
        case "medico": motivo = "Por motivos médicos"; break;
        case "cuidado-familiar": motivo = "Por motivos familiares"; break;
        case "otro": motivo = req.body["texto-otro"]; break;
    }

    try {
        let id = req.session.user.no_justificadas[req.query.i];
        const data = {motivo: motivo};
        await messaging.sendToApiJSON(data, `/seguimiento/asistencias/${id}`, res, false);
        res.render('exito', {mensaje: 'Justificación enviada con éxito'});
    }
    catch (error) {
        logger.error(error);
        res.render('error', {error: error.error});
    }
}

async function filtrarAsistencias(req, res) {
    
    const data = {
        estado: 'No Asistida',
        motivo: 'No',
        fecha: req.body.fecha || moment().utc().format('YYYY-MM-DD'),
        espacioId: req.body.espacio || 1
    }

    // Sacamos de la base de datos todas las asistencias no justificadas (no asistidas y sin motivo) en esa fecha y espacio
    const noJustificadas = (await messaging.sendToApiJSON(data, '/seguimiento/asistencias', res, true)).asistencias;

    req.session.user.no_asistidas = [];
    let resultado = [];
    for(let i = 0; i < noJustificadas.length; i++) {
        let asistencia = noJustificadas[i];
        let asistencia_info = await messaging.getFromApi(`/seguimiento/asistencias/${asistencia.id}`, res, true);

        let actividades_ids_docente = (await messaging.getFromApi(`/actividades/usuarios/${asistencia_info.docenteId}`, res, true)).actividades;
        let actividades_ids_espacio = (await messaging.getFromApi(`/actividades/espacios/${asistencia_info.espacioId}`, res, true)).actividades;

        let actividades_ids = actividades_ids_docente.filter(x => {
            for(let j = 0; j < actividades_ids_espacio.length; j++) {
              if (x.id == actividades_ids_espacio[j].id) {
                return true;
              }
            }
            return false;
        });

        for (let j = 0; j < actividades_ids.length; j++) {

            let actividad_id = actividades_ids[j];
            let actividad = await messaging.getFromApi(`/actividades/${actividad_id.id}`, res, true);

            let encontrada = false;

            if (actividad.tiempo_inicio == moment(asistencia_info.fecha + 'Z', 'YYYY-MM-DD HH:mm:00Z').format('HH:mm')) {
                let encontrada = false;

                let clase_strings = [];
                for (let k = 0; k < actividad.clase_ids.length; k++) {
                    let clase_info = await messaging.getFromApi(`/clases/${actividad.clase_ids[k].id}`, res, true);
                    let grupo_info = await messaging.getFromApi(`/grupos/${clase_info.grupo_id}`, res, true);
                    let asignatura_info = await messaging.getFromApi(`/asignaturas/${clase_info.asignatura_id}`, res, true);
                    clase_strings.push(`${asignatura_info.nombre} ${grupo_info.curso}º${grupo_info.letra}`);
                }

                let docente = await messaging.getFromApi(`/usuarios/${asistencia_info.docenteId}`, res, true);
                if (actividad.es_recurrente == 'Sí') {
                    let recurrencias_actividad = (await messaging.getFromApi(`/recurrencias/actividades/${actividad_id.id}`, res, true)).recurrencias;
    
                    for (let k = 0; k < recurrencias_actividad.length; k++) {
                        let recurrencia = await messaging.getFromApi(`/recurrencias/${recurrencias_actividad[k].id}`, res, true);
                        
                        // Si una recurrencia encaja con la fecha de la asistencia, tenemos lo que buscamos, nos saltamos el resto
                        if (recurrence_tool.isInRecurrencia(actividad, recurrencia, asistencia_info.fecha)) {
                            resultado.push({hora: actividad.tiempo_inicio + ' - ' + actividad.tiempo_fin, clase: clase_strings, docente: docente.nombre + ' ' + docente.apellidos});
                            req.session.user.no_asistidas.push({asistencia_id: noJustificadas[i].id, actividad_id: actividad_id.id});
                            encontrada = true;
                            break;
                        }
                    }
                }
                else {
                    resultado.push({hora: actividad.tiempo_inicio + ' - ' + actividad.tiempo_fin, clase: clase_strings, docente: docente.nombre + ' ' + docente.apellidos});
                    req.session.user.no_asistidas.push({asistencia_id: noJustificadas[i].id, actividad_id: actividad_id.id});
                    encontrada = true;
                }
            }

            // Al no haberla encontrado, miramos si es no asistida de una reprogramación
            if (!encontrada) {
                let excepciones_ids = (await messaging.getFromApi(`/excepciones/actividades/${actividad.id}`, res, true)).excepciones;

                for (let k = 0; k < excepciones_ids.length; k++) {
                    let excepcion = await messaging.getFromApi(`/excepciones/${excepciones_ids[k].id}`);
                    
                    // Hay una reprogamación no cancelada de esa actividad para el día de la no asistencia
                    if (excepcion.esta_reprogramada == 'Sí' && excepcion.esta_cancelada == 'No' && 
                        excepcion.fecha_inicio_ex == asistencia_info.fecha) {
                        resultado.push({hora: actividad.tiempo_inicio + ' - ' + actividad.tiempo_fin, clase: clase_strings, docente: docente.nombre + ' ' + docente.apellidos});
                        req.session.user.no_asistidas.push({asistencia_id: noJustificadas[i].id, actividad_id: actividad_id.id});
                        encontrada = true;
                        break;
                    }
                }
            }
        }
    }

    logger.info(JSON.stringify(resultado));

    const espacios_ids = await messaging.getFromApi('/espacios', res, true);
    let espacios = [];
    for (let i  = 0; i < espacios_ids.length; i++) {
        const espacio_info = await messaging.getFromApi(`/espacios/${espacios_ids[i].id}`, res, true);
        espacios.push({id: espacios_ids[i].id, nombre: espacio_info.nombre, seleccionado: data.espacioId == espacios_ids[i].id});
    }

    const docentes_ids = await messaging.getFromApi('/usuarios', res, true);
    let docentes = [];
    req.session.user.sustituto_ids = {};
    for (let i  = 0; i < docentes_ids.length; i++) {
        const docente_info = await messaging.getFromApi(`/usuarios/${docentes_ids[i].id}`, res, true);
        let doc_string = docente_info.nombre + ' ' + docente_info.apellidos;
        docentes.push(doc_string);
        req.session.user.sustituto_ids[doc_string] = docentes_ids[i].id;
    }

    req.session.user.espacio_firma = Number(req.body.espacio);

    let resultado_final = { 
        usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos},
        clases: resultado,
        espacios: espacios,
        docentes: docentes,
        fecha: req.body.fecha || moment().utcOffset(req.session.user.offset).format('YYYY-MM-DD')
    };

    req.session.user.resultado_firma = resultado_final;
    
    res.render('registrar-firmas', resultado_final);
}

async function confirmarFirma(req, res) {
    
    const ids = req.session.user.no_asistidas[Number(req.body.pos)];
    
    let data = null;
    if (req.body.sustituto != 'no') {

        const actividad = await messaging.getFromApi(`/actividades/${ids.actividad_id}`, res, true);
        let mmt_inicio = moment(actividad.tiempo_inicio, "HH:mm");

        data = {
            tipo_registro: 'RegistroSeguimientoFormulario',
            estado: 'Asistida con Irregularidad',
            usuarioId: req.session.user.sustituto_ids[req.body.sustituto],
            fecha: moment(req.session.user.resultado_firma.fecha).hours(mmt_inicio.hours()).minutes(mmt_inicio.minutes()).utc().format('YYYY-MM-DD HH:mm:00[Z]'),
            espacioId: req.session.user.espacio_firma,
            motivo: 'Sustitución, Firma'
        };
        
        await messaging.sendToApiJSON(data, '/seguimiento', res, true);
    }
    else {
        data = { estado: 'Asistida', motivo: 'Firma' };
        await messaging.sendToApiJSON(data, `/seguimiento/asistencias/${ids.asistencia_id}`, res, true);
    }

    req.session.user.resultado_firma.clases.splice(req.body.pos, 1);
    let resultado = {
        usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos},
        clases:  req.session.user.resultado_firma.clases,
        espacios: req.session.user.resultado_firma.espacios,
        docentes: req.session.user.resultado_firma.docentes,
        fecha: req.session.user.resultado_firma.fecha
    }

    res.render('registrar-firmas', resultado);
}

async function verAsistencias(req, res) {
    
    const fecha_busqueda = req.body.fecha || moment().format('YYYY-MM-DD');
    const asistencia_ids = (await messaging.sendToApiJSON({ fecha: fecha_busqueda }, '/seguimiento/asistencias', res, true)).asistencias;

    let asistencias = [];

    for (let i = 0; i < asistencia_ids.length; i++) {
        const asistencia_info = (await messaging.getFromApi(`/seguimiento/asistencias/${asistencia_ids[i].id}`, res, true));
        const docente = await messaging.getFromApi(`/usuarios/${asistencia_info.docenteId}`, res, true);
        const espacio = await messaging.getFromApi(`/espacios/${asistencia_info.espacioId}`, res, true);
        const actividades_esp = (await messaging.getFromApi(`/actividades/espacios/${asistencia_info.espacioId}`, res, true)).actividades;
        const actividades_doc = (await messaging.getFromApi(`/actividades/usuarios/${asistencia_info.docenteId}`, res, true)).actividades;

        let actividades_ids = actividades_doc.filter(x => {
            for(let j = 0; j < actividades_esp.length; j++) {
              if (x.id == actividades_esp[j].id) {
                return true;
              }
            }
            return false;
        });

        for (let j = 0; j < actividades_ids.length; j++) {
            const actividad_id = actividades_ids[j];
            const actividad = await messaging.getFromApi(`/actividades/${actividad_id.id}`, res, true);
            let clase = [];

            for(let k = 0; k < actividad.clase_ids.length; k++) {
                const clase_info = await messaging.getFromApi(`/clases/${actividad.clase_ids[k].id}`, res, true);
                const grupo_info = await messaging.getFromApi(`/grupos/${clase_info.grupo_id}`, res, true);
                const asignatura_info = await messaging.getFromApi(`/asignaturas/${clase_info.asignatura_id}`, res, true);

                clase.push(asignatura_info.nombre + ' ' + grupo_info.curso + 'º' + grupo_info.letra);                
            }

            asistencias.push({hora: actividad.tiempo_inicio + " - " + actividad.tiempo_fin, 
                         clase: clase, 
                         docente: docente.nombre + ' ' + docente.apellidos,
                         espacio: espacio.nombre + ' ' + espacio.edificio,
                         estado: asistencia_info.estado,
                         motivo: asistencia_info.motivo });
        }
    }

    let resultado = { 
        asistencias: asistencias,
        fecha: fecha_busqueda,
        fecha_max: moment().format("YYYY-MM-DD")
    };

    return resultado;
}

async function generarAvisos(req, res) {
    
    const fecha_busqueda = req.body.fecha || moment().format('YYYY-MM-DD');
    const fecha_max_busqueda = req.body.fecha_max || moment().format('YYYY-MM-DD');
    const asistencia_ids = (await messaging.sendToApiJSON({ estado: 'No Asistida', fecha: fecha_busqueda, fecha_max: fecha_max_busqueda }, '/seguimiento/asistencias', res, true)).asistencias;

    let asistencias = [];

    for (let i = 0; i < asistencia_ids.length; i++) {
        const asistencia_info = (await messaging.getFromApi(`/seguimiento/asistencias/${asistencia_ids[i].id}`, res, true));
        const docente = await messaging.getFromApi(`/usuarios/${asistencia_info.docenteId}`, res, true);
        const actividades_esp = (await messaging.getFromApi(`/actividades/espacios/${asistencia_info.espacioId}`, res, true)).actividades;
        const actividades_doc = (await messaging.getFromApi(`/actividades/usuarios/${asistencia_info.docenteId}`, res, true)).actividades;

        let actividades_ids = actividades_doc.filter(x => {
            for(let j = 0; j < actividades_esp.length; j++) {
              if (x.id == actividades_esp[j].id) {
                return true;
              }
            }
            return false;
        });

        for (let j = 0; j < actividades_ids.length; j++) {
            const actividad_id = actividades_ids[j];
            const actividad = await messaging.getFromApi(`/actividades/${actividad_id.id}`, res, true);
            let clase = [];

            for(let k = 0; k < actividad.clase_ids.length; k++) {
                const clase_info = await messaging.getFromApi(`/clases/${actividad.clase_ids[k].id}`, res, true);
                const grupo_info = await messaging.getFromApi(`/grupos/${clase_info.grupo_id}`, res, true);
                const asignatura_info = await messaging.getFromApi(`/asignaturas/${clase_info.asignatura_id}`, res, true);

                clase.push(asignatura_info.nombre + ' ' + grupo_info.curso + 'º' + grupo_info.letra);                
            }

            asistencias.push({fecha: moment(asistencia_info.fecha + 'Z', 'YYYY-MM-DD HH:mmZ').format('DD/MM/YYYY'), //.utcOffset(req.session.user.offset)
                        hora: actividad.tiempo_inicio + " - " + actividad.tiempo_fin, 
                        clase: clase, 
                        docente: docente.nombre + ' ' + docente.apellidos});
        }
    }

    let resultado = { 
        clases: asistencias,
        fecha_inicio: fecha_busqueda,
        fecha_fin: fecha_max_busqueda,
        fecha_max: moment().format("YYYY-MM-DD")
    };

    return resultado;
}

async function enviarAvisos(req, res) {
    const fecha_inicio = req.body.fecha_min;
    const fecha_fin = req.body.fecha_max;
    const data = {fecha: fecha_inicio, max: fecha_fin, estado: 'No Asistida'};

    const asistencias_ids = (await messaging.sendToApiJSON(data, `/seguimiento/asistencias`, res, true)).asistencias;

    const port_spec = (server_config.port_spec) ? ':' + server_config.port : ''
    const url_justificaciones = `${server_config.protocol}://${server_config.host}${port_spec}/lista-registro-motivo-falta`;

    for (let i = 0; i < asistencias_ids.length; i++) {
        const asistencia_info = (await messaging.getFromApi(`/seguimiento/asistencias/${asistencias_ids[i].id}`, res, true));
        const docente = await messaging.getFromApi(`/usuarios/${asistencia_info.docenteId}`, res, true);
        const espacio = await messaging.getFromApi(`/espacios/${asistencia_info.espacioId}`, res, true);
        const actividades_esp = (await messaging.getFromApi(`/actividades/espacios/${asistencia_info.espacioId}`, res, true)).actividades;
        const actividades_doc = (await messaging.getFromApi(`/actividades/usuarios/${asistencia_info.docenteId}`, res, true)).actividades;

        let actividades_ids = actividades_doc.filter(x => {
            for(let j = 0; j < actividades_esp.length; j++) {
              if (x.id == actividades_esp[j].id) {
                return true;
              }
            }
            return false;
        });

        for (let j = 0; j < actividades_ids.length; j++) {
            const actividad_id = actividades_ids[j];
            const actividad = await messaging.getFromApi(`/actividades/${actividad_id.id}`, res, true);
            let clase = [];

            for(let k = 0; k < actividad.clase_ids.length; k++) {
                const clase_info = await messaging.getFromApi(`/clases/${actividad.clase_ids[k].id}`, res, true);
                const grupo_info = await messaging.getFromApi(`/grupos/${clase_info.grupo_id}`, res, true);
                const asignatura_info = await messaging.getFromApi(`/asignaturas/${clase_info.asignatura_id}`, res, true);

                clase.push(asignatura_info.nombre + ' ' + grupo_info.curso + 'º' + grupo_info.letra);                
            }

            const message = {
                from: process.env.MAIL_USER,
                to: `${docente.email}`,
                subject: `Justificación de faltas necesaria`,
                text: `No hemos detectado tu presencia a las ${actividad.fecha_inicio} en el aula ${espacio.nombre}. Puedes hacernos saber porqué en ${url_justificaciones}.`
            };
            
            mailer.sendMail(message, (err, info) => {
                if (err) {
                    logger.warn(`No se ha podido enviar el correo a ${docente.email}`);
                    res.render('error', { error: 'Ha ocurrido un error al enviar los avisos', redirect: 'generar-avisos'});
                    return;
                }
                logger.info(`Se ha enviado un aviso por falta de asistencia a ${docente.email} correctamente`);
            });
        }
    }

    res.render('exito', {mensaje: 'Todos los correos se han enviado con éxito'});
}

async function verProfesoresInfracciones(req, res) {

    const data = {estado: 'No Asistida'};

    const asistencias_ids = (await messaging.sendToApiJSON(data, `/seguimiento/asistencias`, res, true)).asistencias;

    let profesores = [];
    for (let i = 0; i < asistencias_ids.length; i++) {
        const asistencia_info = await messaging.getFromApi(`/seguimiento/asistencias/${asistencias_ids[i].id}`, res, true);
        const docente_id = asistencia_info.docenteId;

        if (profesores[docente_id] == null) profesores[docente_id] = {};

        if (profesores[docente_id].nombre == null) {
            const docente_info = await messaging.getFromApi(`/usuarios/${docente_id}`, res, true);
            profesores[docente_id].nombre = docente_info.nombre + ' ' + docente_info.apellidos;
        }

        if (profesores[docente_id].totales == null) profesores[docente_id].totales = 0;
        profesores[docente_id].totales++;

        if (profesores[docente_id].justificadas == null) profesores[docente_id].justificadas = 0;
        if (asistencia_info.motivo != null) {
            profesores[docente_id].justificadas++;
        }
        
        if (profesores[docente_id].mes == null) profesores[docente_id].mes = 0;
        if (moment(asistencia_info.fecha + 'Z', 'YYYY-MM-DD HH:mmZ').format('MM') == moment().format('MM')) {
            profesores[docente_id].mes++;
        }
    }

    const resultado = {
        usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos},
        docentes: profesores
    }

    res.render('profesores-infracciones', resultado);
}

module.exports = {
    getAJustificar, justificar, confirmarFirma, filtrarAsistencias, verAsistencias, generarAvisos, verProfesoresInfracciones, enviarAvisos
}