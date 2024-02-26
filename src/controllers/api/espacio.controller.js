const { Op } = require("sequelize");
const moment = require('moment');

async function getEspacios(req, res, db) {
    const transaction = await db.sequelize.transaction();
    
    try {
        console.log('Searching in Espacio for id, numero, tipo, edificio');
        console.log(`${JSON.stringify(db.sequelize.models)} ${db.sequelize.models.Espacio}`)
        const query = await db.sequelize.models.Espacio.findAll({
            attributes:['id', 'tipo', 'numero', 'edificio'],
            order: ['edificio', 'tipo', 'numero']
        });

        let espacios = [];
        query.forEach((esp) => {
            const values = esp.dataValues;
            espacios.push({ id: values.id, nombre: `${values.tipo} ${values.numero}`, edificio: values.edificio });
        });

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(espacios);
    }
    catch (error) {
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }

    await transaction.commit();
}


async function getEspacioById(req, res, db) {
    const transaction = await db.sequelize.transaction();
    
    try {
        console.log('Searching in Espacio for id, creadoPor, actualizadoPor, creadoEn, actualizadoEn, numero, tipo, edificio');
        const query = await db.sequelize.models.Espacio.findOne({
            attributes:['id', 'creadoPor', 'actualizadoPor', 'creadoEn', 'actualizadoEn', 'edificio', 'tipo', 'numero'],
            where: {
                id: req.params.idEspacio
            }
        });

        const respuesta = {
            id: query.id,
            creadoEn: query.creadoEn,
            actualizadoEn: query.actualizadoEn,
            creadoPor: query.creadoPor,
            actualizadoPor: query.actualizadoPor,
            nombre: `${query.tipo} ${query.numero}`,
            edificio: query.edificio
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


async function getEspaciosOfUsuario(req, res, db) {
    let idUsuario = 0;
    try {
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
                id: req.params.idUsuario
            }
        })

        // Comprobamos que el usuario exista en la base de datos
        if (Object.keys(query_doc.dataValues).length == 0) {
            res.status(404).send('Usuario no encontrado');
            await transaction.rollback();
            return;
        }

        let respuesta = { espacios: [] };
        let actividades_ids = [];
        let actividades_posibles = [];
        let espacios_ids = [];
        
        const currentHour = "16:30"; //moment().format('HH:mm'); //Cambiar la hora para probar aquí

        switch (req.body.opcion) {
            case "espacios_rutina":

                console.log('Searching in Actividad impartida por Docente for actividad_id');
                const query_r = await db.sequelize.models.Actividad.findAll({
                    attributes: ['id'], 
                    include: {
                        model: db.sequelize.models.Docente,
                        as: 'impartida_por',
                        where: {
                            id: req.params.idUsuario 
                        }
                    },
                });
                
                //Si tiene actividades
                if (query_r.length != 0) {

                    query_r.forEach((act) => {
                        actividades_ids.push(act.dataValues.id);
                    });

                    console.log('Searching in Actividad for id, tiempo_inicio, tiempo_fin');
                    
                    //Comprobamos que estén en la franja horaria actual
                    const query_act_r = await db.sequelize.models.Actividad.findAll({
                        attributes:['id', 'tiempo_inicio', 'tiempo_fin'],
                        where: {
                            id: {
                                [Op.or]: actividades_ids
                            }
                        }
                    });

                    query_act_r.forEach((act) => {
                        if (act.dataValues.tiempo_inicio <= currentHour && currentHour <= act.dataValues.tiempo_fin) {
                            actividades_posibles.push(act.dataValues.id);
                        }
                    });

                    //Si hay actividades posibles en estos momentos buscamos sus espacios
                    if (actividades_posibles.length != 0) {

                        console.log('Searching in Espacio ocupado por Actividad for id');
                        
                        //Encontramos todos los ids de los espacios pertenecientes a actividades posibles
                        const query_esp_r = await db.sequelize.models.Espacio.findAll({
                            attributes:['id'],
                            include: {
                                model: db.sequelize.models.Actividad,
                                as: 'ocupado_por',
                                where: {
                                    id: {
                                        [Op.or]: actividades_posibles
                                    }
                                }
                            },
                            order: [['edificio'], ['tipo'], ['numero']]
                        });

                        //Obtenemos los espacios de las actividades
                        query_esp_r.forEach((esp) => {
                            espacios_ids.push({ id: esp.dataValues.id });
                        });

                        respuesta.espacios = espacios_ids;
                    }
                }

            break;
            case "espacios_irregularidad":

                console.log('Searching in Actividad impartida por Docente for id');
                const query_i = await db.sequelize.models.Actividad.findAll({
                    attributes: ['id'], 
                    include: {
                        model: db.sequelize.models.Docente,
                        as: 'impartida_por',
                        where: { 
                            id: req.params.idUsuario
                        }
                    }
                });
                
                //Si tiene actividades
                if (query_i.length != 0) {

                    console.log(query_i);

                    query_i.forEach((act) => {
                        actividades_ids.push(act.dataValues.id);
                    });

                    console.log('Searching in Actividad for id, tiempo_inicio, tiempo_fin');
                    
                    //Comprobamos que estén en la franja horaria actual
                    const query_act_i = await db.sequelize.models.Actividad.findAll({
                        attributes:['id', 'tiempo_inicio', 'tiempo_fin'],
                        where: {
                            id: {
                                [Op.or]: actividades_ids
                            }
                        }
                    });

                    query_act_i.forEach((act) => {
                        if (act.dataValues.tiempo_inicio <= currentHour && currentHour <= act.dataValues.tiempo_fin) {
                            actividades_posibles.push(act.dataValues.id);
                        }
                    });

                    //Si hay actividades posibles en estos momentos buscamos sus espacios
                    if (actividades_posibles.length != 0) {

                        console.log('Searching in Espacio ocupado por Actividad for espacio_id');
                        
                        //Encontramos todos los ids de los espacios pertenecientes a actividades posibles
                        const query_esp_i = await db.sequelize.models.Espacio.findAll({
                            attributes:['id'],
                            include: {
                                model: db.sequelize.models.Actividad,
                                as: 'ocupado_por',
                                where: {
                                    id: {
                                    [Op.or]: actividades_posibles
                                    }
                                }
                            }
                        });

                        //Obtenemos los espacios de las actividades
                        query_esp_i.forEach((esp) => {
                            espacios_ids.push({ id: esp.dataValues.id });
                        });

                        let query_neg_i = await db.sequelize.models.Espacio.findAll({
                            attributes: ['id'],
                            where: {
                                [Op.not]: { [Op.or]: espacios_ids }
                            },
                            order: [['edificio'], ['tipo'], ['numero']]
                        });

                        let espacios_ids_neg = [];
                        query_neg_i.forEach((esp) => {
                            espacios_ids_neg.push({ id: esp.dataValues.id });
                        });
                        
                        respuesta.espacios = espacios_ids_neg;
                    }
                }
                else {
                    let query_esp = await db.sequelize.models.Espacio.findAll({
                        attributes: ['id'],
                        order: [['edificio'], ['tipo'], ['numero']]
                    });

                    let todo_espacio = [];
                    query_esp.forEach((esp) => {
                        todo_espacio.push({ id: esp.dataValues.id });
                    });

                    respuesta.espacios = todo_espacio;
                }
                
            break;
            default:
                res.status(422).send('Datos no válidos');
                return;
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
    getEspacios, getEspacioById, getEspaciosOfUsuario
}