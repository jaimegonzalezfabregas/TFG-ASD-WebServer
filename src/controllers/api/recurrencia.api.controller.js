
async function getRecurrenciaById(req, res, db) {
    let idRecurrencia = null;
    try {
        idRecurrencia = Number(req.params.idRecurrencia);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        const query_rec = await db.sequelize.models.Recurrencia.findOne({
            attributes:['tipo_recurrencia', 'separacion', 'maximo', 'dia_semana', 'semana_mes', 'dia_mes', 'mes_anio'],
            where: {
                id: idRecurrencia
            }
        });

        if (Object.keys(query_rec.dataValues).length == 0) {
            res.status(404).send('Recurrencia no encontrada');
            await transaction.rollback();
            return;
        }

        let respuesta = query_rec.dataValues;
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

async function getRecurrenciaByActividad(req, res, db) {
    let idActividad = null;
    try {
        idActividad = Number(req.params.idActividad);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
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
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }
    
    await transaction.commit();
}

module.exports = {
    getRecurrenciaById, getRecurrenciaByActividad
}