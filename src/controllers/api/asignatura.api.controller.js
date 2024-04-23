const logger = require('../../config/logger.config').child({"process": "api"});

async function getAsignaturaById(req, res, next, db) {
    let idAsignatura = Number(req.params.idAsignatura);
    if (!Number.isInteger(idAsignatura)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        logger.info('Searching in Asignatura for nombre, siglas, departamento, periodo');
        const query_asig = await db.sequelize.models.Asignatura.findOne({
            attributes:['nombre', 'siglas', 'departamento', 'periodo'],
            where: {
                id: idAsignatura
            }
        });

        if (query_asig == null || Object.keys(query_asig.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Asignatura no encontrada';
            return next(err);
        }

        const resultado = query_asig.dataValues;

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
    getAsignaturaById
}