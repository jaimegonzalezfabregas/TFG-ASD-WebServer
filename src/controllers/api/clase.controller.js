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

module.exports = {
    getClaseById
}