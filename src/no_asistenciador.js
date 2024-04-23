const logger = require('./config/logger.config').child({"process": "asistencia_daemon"});

const { Cron } = require('croner');
const db = require('./models');
const moment = require('moment');
const recurrence_tool = require('./utils/recurrence_tool');
const { Op } = require('sequelize');

async function noAsistenciar() {
    let num_no_asistidas = 0;
    const current_date = moment().utc();
    
    const query_act = await db.sequelize.models.Actividad.findAll({
        attributes: ['id', 'tiempo_inicio', 'tiempo_fin', 'fecha_inicio', 'fecha_fin', 'es_recurrente']
    });

    if (query_act != null) {

        // Lista de actividades para las que haya que comprobar asistencias
        let actividades_del_dia = [];
        for (let i = 0; i < query_act.length; i++) {  
            let act = query_act[i];

            if (act.dataValues.es_recurrente == 'Sí') {
                
                // Recurrencias de la actividad
                let query_rec = await db.sequelize.models.Recurrencia.findAll({
                    where: {
                        actividad_id: act.dataValues.id
                    }
                });

                let rec_list = [];
                query_rec.forEach((elem) => rec_list.push(elem.dataValues));
                let [exists, ultima_actividad] = recurrence_tool.getLastEventOfActividad(act, rec_list);

                if (exists && ultima_actividad.utc().format('DD-MM-YYYY') == current_date.format('DD-MM-YYYY')) {
                    actividades_del_dia.push({
                        id: act.dataValues.id,
                        inicio: ultima_actividad.format('YYYY-MM-DD HH:mm:00[Z]'), 
                        fin: recurrence_tool.getFinActividad(ultima_actividad, moment(act.dataValues.tiempo_fin, 'HH:mm').utc().format('HH:mm')).format('YYYY-MM-DD HH:mm:00[Z]')
                    });
                }
            }
            else if (act.dataValues.fecha_fin && act.dataValues.fecha_fin.includes(current_date.format('DD-MM-YYYY'))) { // Termina en el día
                actividades_del_dia.push({id: act.dataValues.id, inicio: act.dataValues.fecha_inicio + 'Z', fin: act.dataValues.fecha_fin + 'Z'});
            }
        };

        // Reprogramaciones para hoy
        const reprogramaciones = await db.sequelize.models.Excepcion.findAll({
            attributes: ['actividad_id', 'fecha_inicio_ex', 'fecha_fin_ex'],
            where: {
                fecha_fin_ex: { [Op.and]: [{ [Op.gte]: moment().utc().format('YYYY-MM-DDT00:00:00') }, { [Op.lte]: moment().utc().format('YYYY-MM-DDT23:59:59') }]},
                esta_reprogramado: 'Sí',
                esta_cancelado: 'No'
            }
        });

        reprogramaciones.forEach((rep => {
            actividades_del_dia.push({id: rep.dataValues.actividad_id, inicio: rep.dataValues.fecha_inicio_ex + 'Z', fin: rep.dataValues.fecha_fin_ex + 'Z'});
        }));

        for(let i = 0; i < actividades_del_dia.length; i++) {
            // El responsable de la actividad da clase en ella, así que está en la relación imparte
            const query_doc = await db.sequelize.models.Docente.findAll({ 
                attributes: ['id'],
                include: {
                    model: db.sequelize.models.Actividad,
                    as: 'imparte',
                    where: {
                        id: actividades_del_dia[i].id
                    }
                }
            });
    
            const query_esp = await db.sequelize.models.Espacio.findAll({
                attributes: ['id'],
                include: {
                    model: db.sequelize.models.Actividad,
                    as: 'ocupado_por',
                    where: {
                        id: actividades_del_dia[i].id
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
            });
            
            // Buscar asistencias de las actividades
            // Para tener en cuenta actividades que duren más de un día (si es que existen), buscar en un intervalo (where: { fecha: [Op.and]: [[Op.gt] inicio, [Op.lt]: fin]]})
            // Si no hay, generar una No Asistida
            for (let j = 0; j < lista_docentes.length; j++) {
                
                let docente_actual = lista_docentes[j];
                
                const [asist, asist_cr] = await db.sequelize.models.Asistencia.findOrCreate({
                    where: {
                        docente_id: docente_actual,
                        espacio_id: {
                            [Op.or]: lista_espacios
                        },
                        fecha: {
                            [Op.and]: [{[Op.gte]: actividades_del_dia[i].inicio}, {[Op.lte]: actividades_del_dia[i].fin}]
                        }
                    },
                    defaults: {
                        espacio_id: lista_espacios[0],
                        docente_id: docente_actual,
                        fecha: actividades_del_dia[i].inicio,
                        estado: 'No Asistida'
                    }   
                });

                if (asist_cr) {
                    num_no_asistidas += 1;
                }
            }
        }
    }
    
    logger.info(`${num_no_asistidas} no asistencias registradas`);
}

// Expresiones de 6, * para no especificar, en ss mm HH DD MM nD (nD = número de días)
// Para que funcione bien, ejecutar en el MISMO día (Todos los días, a las 23:00:00 = '0 0 23 * *')
Cron('0 0 23 * *', noAsistenciar());

//noAsistenciar();