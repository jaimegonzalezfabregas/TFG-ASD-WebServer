const { Cron } = require('croner');
const db = require('./models/');
const moment = require('moment');
const recurrence_parser = require('./parse_fecha');
const { Op } = require('sequelize');

async function noAsistenciar() {
    const current_date = moment(moment.now());
    
    const query_act = await db.sequelize.models.Actividad.findAll({
        attributes: ['id', 'tiempo_inicio', 'tiempo_fin', 'fecha_inicio', 'fecha_fin', 'es_recurrente']
    });

    if (query_act != null) {

        // Lista de actividades para las que haya que comprobar asistencias
        let actividades_del_dia = [];
        let fechas_actividades = [];
        for (let i = 0; i < query_act.length; i++) {  
            let act = query_act[i];
            console.log('ACTIVIDAD', act.dataValues.id);

            if (act.dataValues.es_recurrente == 'Sí') {
                
                // Recurrencias de la actividad
                let query_rec = await db.sequelize.models.Recurrencia.findAll({
                    where: {
                        actividad_id: act.dataValues.id
                    }
                });

                let rec_list = [];
                query_rec.forEach((elem) => rec_list.push(elem.dataValues));
                let ultima_actividad = moment(recurrence_parser.getLastEventOfActividad(act, rec_list));

                if (act.dataValues.id == 6) {
                    console.log(ultima_actividad, act, rec_list);
                }

                if (ultima_actividad.isValid() && ultima_actividad.format('DD-MM-YYYY') == current_date.format('DD-MM-YYYY')) {
                    actividades_del_dia.push(act.dataValues.id);
                    fechas_actividades[act.dataValues.id] = {inicio: ultima_actividad, fin: recurrence_parser.getFinActividad(ultima_actividad, act.dataValues.tiempo_fin)};
                }
            }
            else if (act.dataValues.fecha_fin && act.dataValues.fecha_fin.includes(current_date.format('DD-MM-YYYY'))) { // Termina en el día
                actividades_del_dia.push(act.dataValues.id);
                fechas_actividades[act.dataValues.id] = {inicio: act.dataValues.fecha_inicio, fin: act.dataValues.fecha_fin};
            }
        };

        console.log('Actividades', actividades_del_dia);

        for(let i = 0; i < actividades_del_dia.length; i++) {
            // El responsable de la actividad da clase en ella, así que está en la relación imparte
            const query_doc = await db.sequelize.models.Docente.findAll({ 
                attributes: ['id'],
                include: {
                    model: db.sequelize.models.Actividad,
                    as: 'imparte',
                    where: {
                        id: actividades_del_dia[i]
                    }
                }
            });
    
            const query_esp = await db.sequelize.models.Espacio.findAll({
                attributes: ['id'],
                include: {
                    model: db.sequelize.models.Actividad,
                    as: 'ocupado_por',
                    where: {
                        id: actividades_del_dia[i]
                    }
                }
            });
    
            let lista_docentes = [];
            let lista_espacios = [];

            query_doc.forEach((doc) => {
                lista_docentes.push(doc.dataValues.id);
            });

            query_esp.forEach((esp) => {
                lista_espacios.push(esp.dataValues.id);
            })
            
            // Buscar asistencias de las actividades
            // Para tener en cuenta actividades que duren más de un día (si es que existen), buscar en un intervalo (where: { fecha: [Op.and]: [[Op.gt] inicio, [Op.lt]: fin]]})
            // Si no hay, generar una No Asistida
            for (let j = 0; j < lista_docentes.length; j++) {
                
                let docente_actual = lista_docentes[j];
                console.log('Docente', docente_actual);
                
                const [asist, asist_cr] = await db.sequelize.models.Asistencia.findOrCreate({
                    where: {
                        docente_id: docente_actual,
                        espacio_id: {
                            [Op.or]: lista_espacios
                        },
                        fecha: {
                            [Op.and]: [{[Op.gte]: fechas_actividades[actividades_del_dia[i]].inicio}, {[Op.lte]: fechas_actividades[actividades_del_dia[i]].fin}]
                        }
                    },
                    defaults: {
                        espacio_id: lista_espacios[0],
                        docente_id: docente_actual,
                        fecha: fechas_actividades[actividades_del_dia[i]].inicio,
                        estado: 'No Asistida'
                    }   
                });
            }
        }
    }
        
}

// Expresiones de 6, * para no especificar, en ss mm HH DD MM nD (nD = número de días)
// Para que funcione bien, ejecutar en el MISMO día (sobre las 23h, '23 * * *')
const comprobarAsistencias = Cron('* * * * *', await noAsistenciar()); // Cada minuto

//noAsistenciar();