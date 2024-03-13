const { Op } = require("sequelize");

async function getClaseById(req, res, db) {
    try {
        idClase = Number(req.params.idClase);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        console.log('Searching in Clase for asignatura_id, grupo_id');
        const query_cla = await db.sequelize.models.Clase.findOne({
            attributes:['asignatura_id', 'grupo_id'],
            where: {
                id: req.params.idClase
            }
        });

        if (Object.keys(query_cla.dataValues).length == 0) {
            res.status(404).send('Clase no encontrada');
            await transaction.rollback();
            return;
        }

        const resultado = query_cla.dataValues;

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(resultado);
    }
    catch (error) {
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }
      
    await transaction.commit();
}

async function getClaseOfAsignaturaGrupo(req, res, db) {
    try {
        Number(req.body.asignatura_id);
        Number(req.body.grupo_id);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        const query_asig = await db.sequelize.models.Asignatura.findOne({
            attributes:['id'],
            where: {
                id: req.body.asignatura_id
            }
        });

        const query_gr = await db.sequelize.models.Grupo.findOne({
            attributes:['id'],
            where: {
                id: req.body.grupo_id
            }
        });

        // Comprobamos que la asignatura y el grupo existan en la base de datos
        if (Object.keys(query_asig.dataValues).length == 0 || Object.keys(query_gr.dataValues).length == 0) {
            res.status(404).send('Clase no encontrada');
            await transaction.rollback();
            return;
        }
    
        console.log('Searching in Clase for id');
        const query_cla = await db.sequelize.models.Clase.findOne({
            attributes:['id'],
            where: {
                asignatura_id: req.body.asignatura_id,
                grupo_id: req.body.grupo_id
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
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }
    
    await transaction.commit();
}

module.exports = {
    getClaseById, getClaseOfAsignaturaGrupo
}