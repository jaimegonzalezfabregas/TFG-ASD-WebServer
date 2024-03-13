const { Op } = require("sequelize");

async function getActividadesOfUsuario(req, res, db) {
    let idUsuario = null;
    try{
        idUsuario = Number(req.params.idUsuario);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }
        
    const transaction = await db.sequelize.transaction();
        
    try {
        console.log('Searching in Docente for id');
        const query_doc = await db.sequelize.models.Docente.findOne({
            attributes:['id'],
            where: {
                id: idUsuario
            }
        });
    
        // Comprobamos que el usuario exista en la base de datos
        if (Object.keys(query_doc.dataValues).length == 0) {
            res.status(404).send('Usuario no encontrado');
            await transaction.rollback();
            return;
        }
    
        let respuesta = { actividades: [] };
    
        console.log('Searching in Actividad impartida por Docente for actividad_id');
        const query_r = await db.sequelize.models.Actividad.findAll({
            attributes: ['id'], 
            include: {
                model: db.sequelize.models.Docente,
                as: 'impartida_por',
                where: {
                    id: idUsuario 
                }
            },
            include: {
                model: db.sequelize.models.Excepcion,
                as: 'con_excepcion',
                where: {
                    esta_cancelado: 'No'
                },
                required: false
            }
        });
                    
        //Si tiene actividades
        if (query_r.length != 0) {
    
            query_r.forEach((act) => {
                respuesta.actividades.push({id: act.dataValues.id});
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

async function getActividadesOfEspacio(req, res, db) {
    let idEspacio = null;
    try {
        idEspacio = Number(req.params.idEspacio);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        const query_esp = await db.sequelize.models.Espacio.findOne({
            attributes:['id'],
            where: {
                id: idEspacio
            }
        });

        // Comprobamos que el espacio exista en la base de datos
        if (Object.keys(query_esp.dataValues).length == 0) {
            res.status(404).send('Espacio no encontrado');
            await transaction.rollback();
            return;
        }
    
        let respuesta = { actividades: [] };
    
        console.log('Searching in Actividad for id');
        const query_act = await db.sequelize.models.Actividad.findAll({
            attributes:['id'],
            include: {
                model: db.sequelize.models.Espacio,
                as: 'impartida_en',
                where: {
                    id: idEspacio
                }
            },
            include: {
                model: db.sequelize.models.Excepcion,
                as: 'con_excepcion',
                where: {
                    esta_cancelado: 'No'
                },
                required: false
            }
        });
               
        //Si tiene actividades
        if (query_act.length != 0) {
            query_act.forEach((act) => {
                respuesta.actividades.push({id: act.dataValues.id});
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

async function getActividadesOfClase(req, res, db) {
    let idClase = null;
    try {
        idClase = Number(req.params.idClase);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        const query_cla = await db.sequelize.models.Clase.findOne({
            attributes:['id'],
            where: {
                id: idClase
            }
        });

        // Comprobamos que el espacio exista en la base de datos
        if (Object.keys(query_cla.dataValues).length == 0) {
            res.status(404).send('Clase no encontrada');
            await transaction.rollback();
            return;
        }
    
        let respuesta = { actividades: [] };
    
        console.log('Searching in Actividad for id');
        const query_act = await db.sequelize.models.Actividad.findAll({
            attributes:['id'],
            include: {
                model: db.sequelize.models.Clase,
                as: 'sesion_de',
                where: {
                    id: idClase
                }
            },
            include: {
                model: db.sequelize.models.Excepcion,
                as: 'con_excepcion',
                where: {
                    esta_cancelado: 'No'
                },
                required: false
            }
        });
               
        //Si tiene actividades
        if (query_act.length != 0) {
            query_act.forEach((act) => {
                respuesta.actividades.push({id: act.dataValues.id});
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

async function getActividadById(req, res, db) {
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
        console.log('Searching in Actividad for id, fecha_inicio, fecha_fin, tiempo_inicio, tiempo_fin, es_todo_el_dia, es_recurrente');
        const query_act = await db.sequelize.models.Actividad.findOne({
            attributes:['id', 'fecha_inicio', 'fecha_fin', 'tiempo_inicio', 'tiempo_fin', 'es_todo_el_dia', 'es_recurrente'],
            where: {
                id: idActividad
            },
            include: {
                model: db.sequelize.models.Clase,
                as: 'sesion_de',
                attributes: ['id']
            }
        });

        if (Object.keys(query_act.dataValues).length == 0) {
            res.status(404).send('Actividad no encontrada');
            await transaction.rollback();
            return;
        }

        // Sacamos información no necesaria
        const clase_ids = []
        query_act.sesion_de.forEach((sesion) => {
            clase_ids.push({id: sesion.id});
        });

        const resultado = { 
            id: query_act.id, fecha_inicio: query_act.fecha_inicio,
            fecha_fin: query_act.fecha_fin, tiempo_inicio: query_act.tiempo_inicio,
            tiempo_fin: query_act.tiempo_fin, es_todo_el_dia: query_act.es_todo_el_dia,
            es_recurrente: query_act.es_recurrente, clase_ids: clase_ids
        };

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
    getActividadesOfUsuario, getActividadesOfEspacio, getActividadesOfClase, getActividadById
}