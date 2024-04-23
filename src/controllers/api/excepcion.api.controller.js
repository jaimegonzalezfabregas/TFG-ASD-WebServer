const logger = require('../../config/logger.config').child({"process": "api"});
const recurrence_tool = require('../../utils/recurrence_tool');
const moment = require('moment');

async function createExcepcion(req, res, next, db) {
    let actividadId = Number(req.body.actividad_id);
    if (!Number.isInteger(actividadId)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    if (req.body.esta_cancelado == null && req.body.esta_reprogramado == null) {
        let err = {};
        err.status = 422;
        err.message = 'Datos no válidos';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        logger.info('Searching in Actividad for id, es_recurrente, fecha_inicio, fecha_fin, tiempo_inicio');
        const query_act = await db.sequelize.models.Actividad.findOne({
            attributes:['id', 'es_recurrente', 'fecha_inicio', 'fecha_fin', 'tiempo_inicio', 'tiempo_fin'],
            where: {
                id: actividadId
            }
        });
    
        // Comprobamos que la actividad exista en la base de datos
        if (query_act == null || Object.keys(query_act.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Actividad no encontrada';
            return next(err);
        }

        const query_ex = await db.sequelize.models.Excepcion.findAll({
            where: {    
                actividad_id: actividadId
            }
        });
        
        let ignoreActividad = false;
        // Se va a cancelar
        if (req.body.esta_cancelado == 'Sí') {
            let hasMatch = false;
            for (let i = 0; i < query_ex.length; i++) {
                let excep = query_ex[i];

                // Existe una excepción para esa instancia ya, no crea una nueva excepción
                if (req.body.fecha_inicio_act == excep.dataValues.fecha_inicio_act && req.body.fecha_fin_act == excep.dataValues.fecha_fin_act) {
                    hasMatch = true;
                    await db.sequelize.models.Excepcion.update({esta_cancelado: 'Sí'}, {
                        where: {
                            id: excep.dataValues.id
                        }
                    });

                    break;
                } // Se va a cancelar una reprogramación de una clase
                else if (req.body.fecha_inicio_act == excep.dataValues.fecha_inicio_ex && req.body.fecha_fin_act == excep.dataValues.fecha_fin_ex) {
                    hasMatch = true;
                    await db.sequelize.models.Excepcion.update({esta_cancelado: 'Sí'}, {
                        where: {
                            id: excep.dataValues.id
                        }
                    });

                    break;
                } 
            }

            // No existe una excepción para esa instancia de momento se crea una nueva excepción
            if (!hasMatch) {
                let encontrada = await verifyActividad(db, req.body.fecha_inicio_act, query_act, actividadId);

                if(encontrada) {  // Si existe la actividad a en el día a cancelar se cancela
                    await db.sequelize.models.Excepcion.create({
                        fecha_inicio_act: req.body.fecha_inicio_act + 'Z',
                        fecha_fin_act: req.body.fecha_fin_act + 'Z',
                        actividad_id: actividadId,
                        esta_cancelado: 'Sí',
                        esta_reprogramado: 'No'
                    });
                }
                else {
                    await transaction.rollback();
                    let err = {};
                    err.status = 422;
                    err.message = 'Datos no válidos';
                    return next(err);    
                }
                
            }

        } // Se va a reprogramar
        else if (req.body.esta_reprogramado == 'Sí') {
            let hasMatch = false;
            for (let i = 0; i < query_ex.length; i++) {
                let excep = query_ex[i];
                // Se reprograma una clase de hoy
                if (req.body.fecha_inicio_act == excep.dataValues.fecha_inicio_act && req.body.fecha_fin_act == excep.fecha_fin_act && excep.dataValues.esta_cancelado == 'Sí') {
                    hasMatch = true;
    
                    await db.sequelize.models.Excepcion.update({
                        esta_cancelado: 'No',
                        esta_reprogramado: 'Sí',
                        fecha_inicio_ex: req.body.fecha_inicio_ex + 'Z',
                        fecha_fin_ex: req.body.fecha_fin_ex + 'Z'
                    }, {
                        where: {
                            id: excep.dataValues.id
                        }
                    });

                    break;
                } // Se reprograma una clase reprogramada anteriormente
                else if (req.body.fecha_inicio_act == excep.dataValues.fecha_inicio_ex && req.body.fecha_fin_act == excep.dataValues.fecha_fin_ex && excep.dataValues.esta_reprogramado == 'Sí') {
                    await db.sequelize.models.Excepcion.update({esta_cancelado: 'Sí'}, {
                        where: {
                            id: excep.dataValues.id
                        }
                    });
                    // Cancelamos la reprogramación anterior, y lo tenemos en cuenta para crear una excepción nueva de reprogramación
                    ignoreActividad = true;

                    break;
                }
            }

            // No existe una excepción para esa instancia de momento se crea una nueva excepción
            if (!hasMatch) {
                let encontrada = await verifyActividad(db, req.body.fecha_inicio_act, query_act, actividadId);
                
                if (ignoreActividad || encontrada) { // Si existe la actividad a en el día a cancelar se cancela
                    await db.sequelize.models.Excepcion.create({
                        fecha_inicio_act: req.body.fecha_inicio_act + 'Z',
                        fecha_fin_act: req.body.fecha_fin_act + 'Z',
                        fecha_inicio_ex: req.body.fecha_inicio_ex + 'Z',
                        fecha_fin_ex: req.body.fecha_fin_ex + 'Z',
                        actividad_id: actividadId,
                        esta_cancelado: 'No',
                        esta_reprogramado: 'Sí'
                    });
                }
                else {
                    await transaction.rollback();
                    let err = {};
                    err.status = 422;
                    err.message = 'Datos no válidos';
                    return next(err);   
                }
            }
        }
    
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send('Excepción creada con éxito');
            
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        await transaction.rollback();
        let err = {};
        err.status = 500;
        err.message = 'Something went wrong';
        return next(err);
    }
    
    await transaction.commit();   
}

async function getExcepcionById(req, res, next, db) {
    let excepcionId = Number(req.params.idExcepcion);
    if (!Number.isInteger(excepcionId)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();

    try {
        const query_ex = await db.sequelize.models.Excepcion.findOne({
            where: {
                id: excepcionId
            }
        });
    
        // Comprobamos que la actividad exista en la base de datos
        if (query_ex == null || Object.keys(query_ex.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Excepción no encontrada';
            return next(err);
        }

        let respuesta = {
            actividad_id: query_ex.dataValues.actividad_id,
            esta_reprogramado: query_ex.dataValues.esta_reprogramado,
            esta_cancelado: query_ex.dataValues.esta_cancelado,
            fecha_inicio_act: query_ex.dataValues.fecha_inicio_act,
            fecha_fin_act: query_ex.dataValues.fecha_fin_act,
            fecha_inicio_ex: query_ex.dataValues.fecha_inicio_ex,
            fecha_fin_ex: query_ex.dataValues.fecha_fin_ex
        };

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(respuesta);
            
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        await transaction.rollback();
        let err = {};
        err.status = 500;
        err.message = 'Something went wrong';
        return next(err);
    }

    await transaction.commit();
}

async function getExcepcionesOfActividad(req, res, next, db) {
    let idActividad = Number(req.params.idActividad);
    if (!Number.isInteger(idActividad)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        const query_esp = await db.sequelize.models.Actividad.findOne({
            attributes:['id'],
            where: {
                id: idActividad
            }
        });

        // Comprobamos que la actividad exista en la base de datos
        if (query_esp == null || Object.keys(query_esp.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Actividad no encontrada';
            return next(err);
        }
    
        let respuesta = { excepciones: [] };
    
        logger.info('Searching in Excepcion for id');
        const query_exc = await db.sequelize.models.Excepcion.findAll({
            attributes:['id'],
            include: {
                model: db.sequelize.models.Actividad,
                as: 'excepcion_de',
                where: {
                    id: idActividad
                }
            }
        });
        
        //Si tiene excepciones
        if (query_exc.length != 0) {
            query_exc.forEach((exc) => {
                respuesta.excepciones.push({id: exc.dataValues.id});
            });
        }
    
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(respuesta);
            
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        await transaction.rollback();
        let err = {};
        err.status = 500;
        err.message = 'Something went wrong';
        return next(err);
    }
    
    await transaction.commit()
}

module.exports = {
    createExcepcion, getExcepcionById, getExcepcionesOfActividad
}

// Comprueba que exista una actividad en la fecha pasada en req
async function verifyActividad(db, fecha_inicio_act, query_act, actividadId) {
    let fecha = moment(fecha_inicio_act + 'Z').format('YYYY-MM-DD');
    let mmt_inicio = moment(fecha + 'T' + query_act.dataValues.tiempo_inicio, 'YYYY-MM-DDTHH:mm').utc();

    if (query_act.dataValues.es_recurrente == 'Sí') {
        let recurrencias_actividad = await db.sequelize.models.Recurrencia.findAll({
            include: {
                model: db.sequelize.models.Actividad,
                as: 'recurrencia_de',
                where: {
                    id: actividadId
                }
            }
        });

        for (let k = 0; k < recurrencias_actividad.length; k++) {
            let recurrencia = recurrencias_actividad[k].dataValues;
            
            // Si una recurrencia encaja con la fecha de la asistencia, tenemos lo que buscamos, nos saltamos el resto
            if (recurrence_tool.isInRecurrencia(query_act.dataValues, recurrencia,  moment(fecha_inicio_act + 'Z', 'YYYY-MM-DD HH:mm:00Z').utc().format('YYYY-MM-DD[T]HH:mm'))) {
                return true;
            }
        }
    }
    else {
        if (mmt_inicio.format('YYYY-MM-DD HH:mm') == moment(fecha_inicio_act + 'Z', 'YYYY-MM-DD HH:mm:00Z').format('YYYY-MM-DD HH:mm')) {
            return true;
        }
    }

    return false;
}