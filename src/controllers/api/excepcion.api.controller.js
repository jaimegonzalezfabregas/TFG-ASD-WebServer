const { Op } = require("sequelize");

async function createExcepcion(req, res, db) {
    let actividadId;
    try {
        actividadId = Number(req.body.actividad_id);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    if (req.body.esta_cancelado == null && req.body.esta_reprogramado == null) {
        res.status(422).send('Datos no válidos');
        await transaction.rollback();
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        console.log('Searching in Actividad for id');
        const query_act = await db.sequelize.models.Actividad.findOne({
            attributes:['id'],
            where: {
                id: actividadId
            }
        });
    
        // Comprobamos que la actividad exista en la base de datos
        if (Object.keys(query_act.dataValues).length == 0) {
            res.status(404).send('Actividad no encontrada');
            await transaction.rollback();
            return;
        }

        const query_ex = await db.sequelize.models.Excepcion.findAll({
            where: {    
                actividad_id: actividadId
            }
        });

        // Se va a cancelar
        if (req.body.esta_cancelado == 'Sí') {
            let hasMatch = false;
            for (let i = 0; i < query_ex.length; i++) {
                let excep = query_ex[i];

                console.log(`Para ${i}: \n  ${req.body.fecha_inicio_act}, ${excep.dataValues.fecha_inicio_act}, ${req.body.fecha_fin_act}, ${excep.dataValues.fecha_fin_act}
                                        \n  ${req.body.fecha_inicio_act == excep.dataValues.fecha_inicio_act && req.body.fecha_fin_act == excep.dataValues.fecha_fin_act} 
                                        \n  ${req.body.fecha_inicio_act == excep.dataValues.fecha_inicio_ex && req.body.fecha_fin_act == excep.dataValues.fecha_fin_ex}`);

                // Existe una excepción para esa instancia ya, no crea una nueva excepción
                if (req.body.fecha_inicio_act == excep.dataValues.fecha_inicio_act && req.body.fecha_fin_act == excep.dataValues.fecha_fin_act) {
                    excep.dataValues.esta_cancelado = 'Sí';
                    hasMatch = true;
                    await excep.save();

                    break;
                } // Se va a cancelar una reprogramación de una clase
                else if (req.body.fecha_inicio_act == excep.dataValues.fecha_inicio_ex && req.body.fecha_fin_act == excep.dataValues.fecha_fin_ex) {
                    excep.dataValues.esta_cancelado = 'Sí';
                    hasMatch = true;
                    await excep.save();

                    break;
                } 
            }

            // No existe una excepción para esa instancia de momento se crea una nueva excepción
            if (!hasMatch) {
                await db.sequelize.models.Excepcion.create({
                    fecha_inicio_act: req.body.fecha_inicio_act,
                    fecha_fin_act: req.body.fecha_fin_act,
                    actividad_id: actividadId,
                    esta_cancelado: 'Sí',
                    esta_reprogramado: 'No'
                });
            }

        } // Se va a reprogramar
        else if (req.body.esta_reprogramado == 'Sí') {
            let hasMatch = false;
            for (let i = 0; i < query_ex.length; i++) {
                let excep = query_ex[i];
                // Se reprograma una clase de hoy
                if (req.body.fecha_inicio_act == excep.dataValues.fecha_inicio_act && req.body.fecha_fin_act == excep.fecha_fin_act && excep.dataValues.esta_cancelado == 'Sí') {
                    hasMatch = true;
                    excep.dataValues.esta_cancelado = 'No';
                    excep.dataValues.esta_reprogramado = 'Sí';
                    excep.dataValues.fecha_inicio_ex = req.body.fecha_inicio_ex;
                    excep.dataValues.fecha_fin_ex = req.body.fecha_fin_ex;
    
                    await excep.save();
                    break;
                } // Se reprograma una clase reprogramada anteriormente
                else if (req.body.fecha_inicio_act == excep.dataValues.fecha_inicio_ex && req.body.fecha_fin_act == excep.dataValues.fecha_fin_ex && excep.dataValues.esta_reprogramado == 'Sí') {
                    excep.dataValues.esta_cancelado = 'Sí';
                    await excep.save();

                    break;
                }
            }

            // No existe una excepción para esa instancia de momento se crea una nueva excepción
            if (!hasMatch) {
                await db.sequelize.models.Excepcion.create({
                    fecha_inicio_act: req.body.fecha_inicio_act,
                    fecha_fin_act: req.body.fecha_fin_act,
                    fecha_inicio_ex: req.body.fecha_inicio_ex,
                    fecha_fin_ex: req.body.fecha_fin_ex,
                    actividad_id: actividadId,
                    esta_cancelado: 'No',
                    esta_reprogramado: 'Sí'
                });
            }
        }
    
        res.setHeader('Content-Type', 'text/html');
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

async function getExcepcionById(req, res, db) {
    let excepcionId;
    try {
        excepcionId = Number(req.body.excepcion_id);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();

    try {
        const query_ex = await db.sequelize.models.Excepcion.findOne({
            where: {
                id: excepcionId
            }
        });
    
        // Comprobamos que la actividad exista en la base de datos
        if (Object.keys(query_ex.dataValues).length == 0) {
            res.status(404).send('Excepcion no encontrada');
            await transaction.rollback();
            return;
        }

        let respuesta = {
            actividad_id: query_ex.dataValues.actividad_id,
            esta_reprogramado: query_ex.dataValues.esta_reprogramado,
            esta_cancelado: query_ex.dataValues.esta_cancelado,
            fecha_inicio_act: query_ex.dataValues.fecha_inicio_act,
            fecha_fin_act: query_ex.dataValues.fecha_fin_act,
            fecha_inicio_ex: query_ex.dataValues.fecha_inicio_ex,
            fecha_fin_ex: query_ex.dataValues.fecha_fin_ex
        };

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

async function getExcepcionesOfActividad(req, res, db) {
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
        const query_esp = await db.sequelize.models.Actividad.findOne({
            attributes:['id'],
            where: {
                id: idActividad
            }
        });

        // Comprobamos que la actividad exista en la base de datos
        if (Object.keys(query_esp.dataValues).length == 0) {
            res.status(404).send('Actividad no encontrada');
            await transaction.rollback();
            return;
        }
    
        let respuesta = { excepciones: [] };
    
        console.log('Searching in Excepcion for id');
        const query_exc = await db.sequelize.models.Excepcion.findAll({
            attributes:['id'],
            include: {
                model: db.sequelize.models.Actividad,
                as: 'excepcion_de',
                where: {
                    id: idActividad
                }
            }
        });
        
        //Si tiene excepciones
        if (query_exc.length != 0) {
            query_exc.forEach((exc) => {
                respuesta.excepciones.push(exc.dataValues);
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
    
    await transaction.commit()
}

module.exports = {
    createExcepcion, getExcepcionById, getExcepcionesOfActividad
}