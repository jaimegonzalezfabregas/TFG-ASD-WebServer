const messaging = require('../../messaging');
const { isInRecurrencia } = require('../../parse_fecha');

async function getAJustificar(req, res) {

    const data = {
        estado: 'No Asistida',
        motivo: 'No'
    }

    const noJustificadas = (await messaging.sendToApiJSON(data, '/seguimiento/asistencias', res, true)).asistencias;

    let resultado = [];
    let k = 0;
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

                let clase_strings = [];
                for(let m = 0; m < actividad.clase_ids.length; m++) {
                    let clase_info = await messaging.getFromApi(`/clases/${actividad.clase_ids[m].id}`, res, true);
                    let grupo_info = await messaging.getFromApi(`/grupos/${clase_info.grupo_id}`, res, true);
                    let asignatura_info = await messaging.getFromApi(`/asignaturas/${clase_info.asignatura_id}`, res, true);

                    clase_strings.push(`${asignatura_info.nombre} ${grupo_info.curso}º${grupo_info.letra}`);
                }

                let recurrencias_ids = (await messaging.getFromApi(`/recurrencias/actividades/${actividad_id.id}`, res, true)).recurrencias;
                for (let l = 0; l < recurrencias_ids.length; l++) {
                    let recurrencia_id = recurrencias_ids[l].id;
                    let recurrencia = await messaging.getFromApi(`/recurrencias/${recurrencia_id}`, res, true);
                    actividad.fecha_fin = moment.now();
                    if (isInRecurrencia(actividad, recurrencia, asistencia_info.fecha)) {
                        resultado.push({fechayhora: asistencia_info.fecha, clase: clase_strings, pos: k});
                        k++;
                        req.session.user.nojustificadas.push(asistencia.id);
                    }
                }
            }
        }
    }

    console.log(JSON.stringify(resultado));

    return resultado;
}

async function justificar(req, res) {
    let motivo = null;
    switch(req.body.motivo) {
        case "olvido": motivo = "Olvidé firmar";
        case "medico": motivo = "Por motivos médicos";
        case "cuidado-familiar": motivo = "Por motivos familiares";
        case "otro": motivo = req.body["texto-otro"];
    }

    try {
        let id = req.session.user.nojustificadas[req.params.k];
        const data = {motivo: motivo};
        await messaging.sendToApiJSON(data, `/seguimiento/asistencias/${id}`, res, false);
        res.render('exito', {mensaje: 'Justificación enviada con éxito'});
    }
    catch (error) {
        res.render('error', {error: error});
    }
}

module.exports = {
    getAJustificar, justificar
}