const logger = require('../../config/logger.config').child({"process": "api"});

async function getClaseById(req, res, db) {
    let idClase = Number(req.params.idClase);
    if (!Number.isInteger(idClase)) {
        res.status(400).send('Id suministrado no válido');
        return;
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
            res.status(404).send('Clase no encontrada');
            await transaction.rollback();
            return;
        }

        const resultado = query_cla.dataValues;

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

async function getClaseOfAsignaturaGrupo(req, res, db) {
    let asignatura_id = Number(req.body.asignatura_id);
    let grupo_id = Number(req.body.grupo_id);

    if (!Number.isInteger(asignatura_id) || !Number.isInteger(grupo_id)) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        const query_asig = await db.sequelize.models.Asignatura.findOne({
            attributes:['id'],
            where: {
                id: asignatura_id
            }
        });

        const query_gr = await db.sequelize.models.Grupo.findOne({
            attributes:['id'],
            where: {
                id: grupo_id
            }
        });

        // Comprobamos que la asignatura y el grupo existan en la base de datos
        if (query_asig == null || Object.keys(query_asig.dataValues).length == 0 || query_gr == null || Object.keys(query_gr.dataValues).length == 0) {
            res.status(404).send('Clase no encontrada');
            await transaction.rollback();
            return;
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
            res.status(404).send('Clase no encontrada');
            await transaction.rollback();
            return;
        }
        
        let respuesta = { id: query_cla.id };
    
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(respuesta);
            
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
    getClaseById, getClaseOfAsignaturaGrupo
}