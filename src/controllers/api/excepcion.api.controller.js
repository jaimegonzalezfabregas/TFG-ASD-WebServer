const { Op } = require("sequelize");

async function createExcepcion(req, res, db) {
    try {
        Number.isInteger(req.body.actividad_id);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        console.log('Searching in Actividad for id');
        const query_act = await db.sequelize.models.Actividad.findOne({
            attributes:['id'],
            where: {
                id: req.body.actividad_id
            }
        });
    
        // Comprobamos que el usuario exista en la base de datos
        if (Object.keys(query_act.dataValues).length == 0) {
            res.status(404).send('Actividad no encontrada');
            await transaction.rollback();
            return;
        }
    
        let data = {
            fecha_inicio: req.body.fecha_inicio,
            fecha_fin: req.body.fecha_fin,
            tiempo_inicio: req.body.tiempo_inicio,
            tiempo_fin: req.body.tiempo_fin,
            es_todo_el_dia: req.body.es_todo_el_dia,
            esta_reprogramado: req.body.esta_reprogramado,
            esta_cancelado: req.body.esta_cancelado,
            actividad_id: req.body.actividad_id
        }

        await db.sequelize.models.excepcion.create(data);
    
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send('Excepción creada con éxito');
            
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
    createExcepcion
}