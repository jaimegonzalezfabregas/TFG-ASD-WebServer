const logger = require('../../config/logger.config').child({"process": "api"});

async function getClaseById(req, res, next, db) {
    let idClase = Number(req.params.idClase);
    if (!Number.isInteger(idClase)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        logger.info('Searching in Clase for asignatura_id, grupo_id');
        const query_cla = await db.sequelize.models.Clase.findOne({
            attributes:['asignatura_id', 'grupo_id'],
            where: {
                id: req.params.idClase
            }
        });

        if (query_cla == null || Object.keys(query_cla.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Clase no encontrada';
            return next(err);
        }

        const resultado = query_cla.dataValues;

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

async function getClaseOfAsignaturaGrupo(req, res, next, db) {
    let asignatura_id = Number(req.body.asignatura_id);
    let grupo_id = Number(req.body.grupo_id);

    if (!Number.isInteger(asignatura_id) || !Number.isInteger(grupo_id)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        const query_asig = await db.sequelize.models.Asignatura.findOne({
            attributes:['id'],
            where: {
                id: asignatura_id
            }
        });

        // Comprobamos que la asignatura exista en la base de datos
        if (query_asig == null || Object.keys(query_asig.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Asignatura no encontrada';
            return next(err);
        }

        const query_gr = await db.sequelize.models.Grupo.findOne({
            attributes:['id'],
            where: {
                id: grupo_id
            }
        });

        // Comprobamos que el grupo exista en la base de datos
        if (query_gr == null || Object.keys(query_gr.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Grupo no encontrado';
            return next(err);
        }
    
        logger.info('Searching in Clase for id');
        const query_cla = await db.sequelize.models.Clase.findOne({
            attributes:['id'],
            where: {
                asignatura_id: asignatura_id,
                grupo_id: grupo_id
            }
        });
               
        //Si no se ha encontrado la clase
        if (query_cla.length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Clase no encontrada';
            return next(err);
        }
        
        let respuesta = { id: query_cla.id };
    
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
    getClaseById, getClaseOfAsignaturaGrupo
}