const logger = require('../../config/logger.config').child({"process": "api"});

async function getRecurrenciaById(req, res, next, db) {
    let idRecurrencia = Number(req.params.idRecurrencia);
    if (!Number.isInteger(idRecurrencia)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        const query_rec = await db.sequelize.models.Recurrencia.findOne({
            attributes:['tipo_recurrencia', 'separacion', 'maximo', 'dia_semana', 'semana_mes', 'dia_mes', 'mes_anio'],
            where: {
                id: idRecurrencia
            }
        });

        if (query_rec == null || Object.keys(query_rec.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Recurrencia no encontrada';
            return next(err);
        }

        let respuesta = query_rec.dataValues;
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

async function getRecurrenciaByActividad(req, res, next, db) {
    let idActividad = Number(req.params.idActividad);
    if (!Number.isInteger(idActividad)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        const query_act = await db.sequelize.models.Actividad.findOne({
            where: {
                id: idActividad
            }
        });

        if (query_act == null || Object.keys(query_act.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Actividad no encontrada';
            return next(err);
        }
        
        const query_rec = await db.sequelize.models.Recurrencia.findAll({
            attributes:['id'],
            include: {
                model: db.sequelize.models.Actividad,
                as: 'recurrencia_de',
                where: {
                    id: idActividad
                }
            }
        });

        let respuesta = {recurrencias: []};
        if (query_rec.length > 0) {
            query_rec.forEach(rec => {
                respuesta.recurrencias.push({id: rec.dataValues.id});
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

module.exports = {
    getRecurrenciaById, getRecurrenciaByActividad
}