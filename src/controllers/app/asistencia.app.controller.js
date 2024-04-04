const messaging = require('../../messaging');
const { isInRecurrencia } = require('../../parse_fecha');
const moment = require('moment');

async function getAJustificar(req, res) {

    const data = {
        estado: 'No Asistida',
        motivo: 'No'
    }

    const noJustificadas = (await messaging.sendToApiJSON(data, '/seguimiento/asistencias', res, true)).asistencias;

    req.session.user.no_justificadas = [];
    let resultado = [];
    let k = 0;
    for(let i = 0; i < noJustificadas.length; i++) {
        let asistencia = noJustificadas[i];
        let asistencia_info = await messaging.getFromApi(`/seguimiento/asistencias/${asistencia.id}`, res, true);

        if (asistencia_info.docenteId == req.session.user.id && asistencia_info.estado == 'No Asistida') {
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
                    //TODO tener en cuenta recurrencias y excepciones
                }
                else { //TODO tener en cuenta excepciones
                    if (moment(actividad.fecha_inicio).hours(moment(actividad.tiempo_inicio, 'HH:mm').hours()).minutes(moment(actividad.tiempo_inicio, 'HH:mm').minutes()).format('YYYY-MM-DD HH:mm') == moment(asistencia_info.fecha).format('YYYY-MM-DD HH:mm')) {
                        encontrada = true;
                    }
                }
                
                if (encontrada) {
                    let clase_strings = [];
                    for(let m = 0; m < actividad.clase_ids.length; m++) {
                        let clase_info = await messaging.getFromApi(`/clases/${actividad.clase_ids[m].id}`, res, true);
                        let grupo_info = await messaging.getFromApi(`/grupos/${clase_info.grupo_id}`, res, true);
                        let asignatura_info = await messaging.getFromApi(`/asignaturas/${clase_info.asignatura_id}`, res, true);

                        clase_strings.push(`${asignatura_info.nombre} ${grupo_info.curso}º${grupo_info.letra}`);
                    
                    }
                    
                    break;
                }
            }

            

        }
    }

    console.log(JSON.stringify(resultado));

    return resultado;
}


// let recurrencias_ids = (await messaging.getFromApi(`/recurrencias/actividades/${actividad_id.id}`, res, true)).recurrencias;
// for (let l = 0; l < recurrencias_ids.length; l++) {
//     let recurrencia_id = recurrencias_ids[l].id;
//     let recurrencia = await messaging.getFromApi(`/recurrencias/${recurrencia_id}`, res, true);
//     actividad.fecha_fin = moment.now();
//     if (isInRecurrencia(actividad, recurrencia, asistencia_info.fecha)) {
//         resultado.push({fechayhora: asistencia_info.fecha, clase: clase_strings, pos: k});
//         k++;
//         req.session.user.no_justificadas.push(asistencia.id);
//     }
// }

async function justificar(req, res) {
    let motivo = null;
    switch(req.body.motivo) {
        case "olvido": motivo = "Olvidé firmar";
        case "medico": motivo = "Por motivos médicos";
        case "cuidado-familiar": motivo = "Por motivos familiares";
        case "otro": motivo = req.body["texto-otro"];
    }

    try {
        let id = req.session.user.no_justificadas[req.params.k];
        const data = {motivo: motivo};
        await messaging.sendToApiJSON(data, `/seguimiento/asistencias/${id}`, res, false);
        res.render('exito', {mensaje: 'Justificación enviada con éxito'});
    }
    catch (error) {
        res.render('error', {error: error});
    }
}

async function filtrarAsistencias(req, res) {

    const data = {
        estado: 'No Asistida',
        motivo: 'No',
        fecha: req.body.fecha || moment().format('DD/MM/YYYY'),
        espacio: req.body.espacio || 1
    }
    console.log(data);
    const noJustificadas = (await messaging.sendToApiJSON(data, '/seguimiento/asistencias', res, true)).asistencias;
    console.log(noJustificadas);

    let clases = [];
    req.session.user.no_asistidas = [];
    for (let i = 0; i < noJustificadas.length; i++) {
        console.log(noJustificadas[i]);
        const asistencia_info = await messaging.getFromApi(`/seguimiento/asistencias/${noJustificadas[i].id}`, res, true);
        console.log(asistencia_info);
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
            let clase = null;

            // Aprovechamos que las no asistencias se guardan con fecha igual al inicio de la actividad a la que no se ha asistido
            if (actividad.tiempo_inicio == moment(asistencia_info.fecha).format('HH:mm')) {
                for(let k = 0; k < actividad.clase_ids.length; k++) {
                    const clase_info = await messaging.getFromApi(`/clases/${actividad.clase_ids[k].id}`, res, true);
                    const grupo_info = await messaging.getFromApi(`/grupos/${clase_info.grupo_id}`, res, true);
                    const asignatura_info = await messaging.getFromApi(`/asignaturas/${clase_info.asignatura_id}`, res, true);
    
                    clase = asignatura_info.nombre + ' ' + grupo_info.curso + 'º' + grupo_info.letra;
                }
    
                let recurrencias_ids = (await messaging.getFromApi(`/recurrencias/actividades/${actividad_id.id}`, res, true)).recurrencias;
                for (let l = 0; l < recurrencias_ids.length; l++) {
                    let recurrencia_id = recurrencias_ids[l].id;
                    let recurrencia = await messaging.getFromApi(`/recurrencias/${recurrencia_id}`, res, true);
                    actividad.fecha_fin = moment().format('YYYY-MM-DD HH:mm:ss');
                    if (isInRecurrencia(actividad, recurrencia, asistencia_info.fecha)) {
                        clases.push({hora: actividad.tiempo_inicio + " - " + actividad.tiempo_fin, 
                                        clase: clase, 
                                        docente: docente.nombre + ' ' + docente.apellidos});
                        req.session.user.no_asistidas.push(noJustificadas[i].id);
                    }
                }
            }
        }
    }
    
    const espacios_ids = await messaging.getFromApi('/espacios', res, true);
    let espacios = [];
    for (let i  = 0; i < espacios_ids.length; i++) {
        const espacio_info = await messaging.getFromApi(`/espacios/${espacios_ids[i].id}`, res, true)
        console.log( req.body.espacio == espacios_ids[i].id);
        espacios.push({id: espacios_ids[i].id, nombre: espacio_info.nombre, seleccionado: data.espacio == espacios_ids[i].id});
    }
    console.log('\n\n\n', clases, '\n\n\n');

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

    let resultado = { 
        usuario: {rol: req.session.user.rol, nombre: req.session.user.nombre, apellidos: req.session.user.apellidos},
        clases: clases,
        espacios: espacios,
        docentes: docentes,
        fecha: req.body.fecha || moment().format('YYYY-MM-DD')
    };

    req.session.user.resultado_firma = resultado;
    
    res.render('registrar-firmas', resultado);
}

async function confirmarFirma(req, res) {
    
    const asistencia_id = req.session.user.no_asistidas[Number(req.body.pos)];
    
    let data = null;
    if (req.body.checkSustituto != null) {

        data = {
            tipo_registro: 'RegistroSeguimientoFormulario',
            estado: 'Asistida con Irregularidad',
            usuarioId: req.session.user.sustituto_ids[req.body.sustituto],
            fecha: req.session.user.resultado_firma.fecha,
            espacioId: req.session.user.espacio_firma,
            motivo: 'Sustitución'
        };
        console.log(data);
        await messaging.sendToApiJSON(data, '/seguimiento', res, true);
    }
    else {
        data = { estado: 'Asistida' };
        await messaging.sendToApiJSON(data, `/seguimiento/asistencias/${asistencia_id}`, res, true);
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

module.exports = {
    getAJustificar, justificar, confirmarFirma, filtrarAsistencias
}