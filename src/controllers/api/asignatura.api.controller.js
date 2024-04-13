const logger = require('../../config/logger.config').child({"process": "api"});

async function getAsignaturaById(req, res, db) {
    let idAsignatura = Number(req.params.idAsignatura);
    if (!Number.isInteger(idAsignatura)) {
        res.status(400).send('Id suministrado no válido');
        return;
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
            res.status(404).send('Asignatura no encontrada');
            await transaction.rollback();
            return;
        }

        const resultado = query_asig.dataValues;

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(resultado);
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }
      
    await transaction.commit();
}

module.exports = {
    getAsignaturaById
}