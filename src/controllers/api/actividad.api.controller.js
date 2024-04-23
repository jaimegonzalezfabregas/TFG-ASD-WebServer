const logger = require('../../config/logger.config').child({"process": "api"});

async function getActividadesOfUsuario(req, res, next, db) {
    let idUsuario = Number(req.params.idUsuario);
    if (!Number.isInteger(idUsuario)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }
        
    const transaction = await db.sequelize.transaction();
        
    try {
        logger.info('Searching in Docente for id');
        const query_doc = await db.sequelize.models.Docente.findOne({
            attributes:['id'],
            where: {
                id: idUsuario
            }
        });
    
        // Comprobamos que el usuario exista en la base de datos
        if (query_doc == null || Object.keys(query_doc.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Usuario no encontrado';
            return next(err);
        }
    
        let respuesta = { actividades: [] };

        logger.info('Searching in Actividad impartida por Docente for actividad_id');
        const query_r = await db.sequelize.models.Actividad.findAll({
            attributes: ['id'], 
            include: {
                model: db.sequelize.models.Docente,
                as: 'impartida_por',
                where: {
                    id: idUsuario 
                }
            }
        });
                    
        //Si tiene actividades
        if (query_r.length != 0) {
            query_r.forEach((act) => {
                respuesta.actividades.push({id: act.dataValues.id});
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
    
    await transaction.commit();    
}

async function getActividadesOfEspacio(req, res, next, db) {
    let idEspacio = Number(req.params.idEspacio);
    if (!Number.isInteger(idEspacio)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        const query_esp = await db.sequelize.models.Espacio.findOne({
            attributes:['id'],
            where: {
                id: idEspacio
            }
        });

        // Comprobamos que el espacio exista en la base de datos
        if (query_esp == null || Object.keys(query_esp.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 500;
            err.message = 'Espacio no encontrado';
            return next(err);
        }
    
        let respuesta = { actividades: [] };
    
        logger.info('Searching in Actividad for id');
        const query_act = await db.sequelize.models.Actividad.findAll({
            attributes:['id'],
            include: {
                model: db.sequelize.models.Espacio,
                as: 'impartida_en',
                where: {
                    id: idEspacio
                }
            }
        });
        
        //Si tiene actividades
        if (query_act.length != 0) {
            query_act.forEach((act) => {
                respuesta.actividades.push({id: act.dataValues.id});
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
    
    await transaction.commit();
}

async function getActividadesOfClase(req, res, next, db) {
    let idClase = Number(req.params.idClase);
    if (!Number.isInteger(idClase)) { 
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        const query_cla = await db.sequelize.models.Clase.findOne({
            attributes:['id'],
            where: {
                id: idClase
            }
        });

        // Comprobamos que la clase exista en la base de datos
        if (query_cla == null || Object.keys(query_cla.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Clase no encontrada';
            return next(err);
        }
    
        let respuesta = { actividades: [] };
    
        logger.info('Searching in Actividad for id');
        const query_act_cla = await db.sequelize.models.Actividad.findAll({
            attributes:['id'],
            include: {
                model: db.sequelize.models.Clase,
                as: 'sesion_de',
                where: {
                    id: idClase
                }
            }
        });
               
        //Si tiene actividades
        if (query_act_cla.length != 0) {
            query_act_cla.forEach((act) => {
                respuesta.actividades.push({id: act.dataValues.id});
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
    
    await transaction.commit();
}

async function getActividadById(req, res, next, db) {
    let idActividad = Number(req.params.idActividad);
    if (!Number.isInteger(idActividad)) {
        let err = {};
        err.status = 404;
        err.message = 'Espacio no encontrado';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        logger.info('Searching in Actividad for id, fecha_inicio, fecha_fin, tiempo_inicio, tiempo_fin, es_todo_el_dia, es_recurrente');
        const query_act = await db.sequelize.models.Actividad.findOne({
            attributes:['id', 'fecha_inicio', 'fecha_fin', 'tiempo_inicio', 'tiempo_fin', 'es_todo_el_dia', 'es_recurrente'],
            where: {
                id: idActividad
            },
            include: {
                model: db.sequelize.models.Clase,
                as: 'sesion_de',
                attributes: ['id']
            }
        });

        if (query_act == null || Object.keys(query_act.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Actividad no encontrada';
            return next(err);
        }

        // Sacamos información no necesaria
        const clase_ids = []
        query_act.sesion_de.forEach((sesion) => {
            clase_ids.push({id: sesion.id});
        });

        const resultado = { 
            id: query_act.id, fecha_inicio: query_act.fecha_inicio,
            fecha_fin: query_act.fecha_fin, tiempo_inicio: query_act.tiempo_inicio,
            tiempo_fin: query_act.tiempo_fin, es_todo_el_dia: query_act.es_todo_el_dia,
            es_recurrente: query_act.es_recurrente, clase_ids: clase_ids
        };

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(resultado);
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

module.exports = {
    getActividadesOfUsuario, getActividadesOfEspacio, getActividadesOfClase, getActividadById
}