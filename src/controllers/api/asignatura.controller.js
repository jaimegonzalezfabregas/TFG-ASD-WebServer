const { Op } = require("sequelize");

async function getAsignaturaById(req, res, db) {
    try {
        idAsignatura = Number(req.params.idAsignatura);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        console.log('Searching in Asignatura for nombre, siglas, departamento, periodo');
        const query_asig = await db.sequelize.models.Asignatura.findOne({
            attributes:['nombre', 'siglas', 'departamento', 'periodo'],
            where: {
                id: req.params.idAsignatura
            }
        });

        if (Object.keys(query_asig.dataValues).length == 0) {
            res.status(404).send('Asignatura no encontrada');
            await transaction.rollback();
            return;
        }

        const resultado = query_asig.dataValues;

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
    getAsignaturaById
}