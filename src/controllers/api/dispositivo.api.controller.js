const logger = require('../../config/logger.config').child({"process": "api"});

const moment = require('moment');
const { authenticator } = require('otplib');

async function getDispositivos(req, res, db) {

    const transaction = await db.sequelize.transaction();
    
    try {
        logger.info('Searching in Dispositivo for id, nombre, espacioId, idExternoDispositivo');
        const query = await db.sequelize.models.Dispositivo.findAll({
            attributes:['id', 'nombre', 'espacioId', 'idExternoDispositivo']
        });

        let dispositivos = [];
        query.forEach((disp) => {
            dispositivos.push(disp.dataValues);
        });
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(dispositivos);
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }

    await transaction.commit();    
}

async function creaDispositivo(req, res, db, api_config) {
    if (req.body != null && Object.keys(req.body).length == 3 && req.body.nombre != null && req.body.espacioId != null && req.body.idExternoDispositivo != null) {

        if (!Number.isInteger(req.body.espacioId) || typeof req.body.nombre != 'string' || typeof req.body.idExternoDispositivo != 'string') {
            res.status(422).send('Datos no válidos');
            return;
        }
        
        const transaction = await db.sequelize.transaction();

        try {   
            const port_spec = (api_config.port_spec) ? ':' + api_config.port : '';
            const endpointSeguimiento = `${api_config.protocol}://${api_config.host}${port_spec}${api_config.path}/seguimiento`;
            const dispSecret = authenticator.generateSecret();

            let [disp, created] = await db.sequelize.models.Dispositivo.findOrCreate({
                where: {
                    nombre: req.body.nombre,
                    espacioId: req.body.espacioId
                },
                defaults: { 
                    nombre: req.body.nombre, 
                    espacioId: req.body.espacioId, 
                    idExternoDispositivo: req.body.idExternoDispositivo, 
                    creadoPor: 1, actualizadoPor: 1, 
                    endpointSeguimiento: endpointSeguimiento , 
                    t0: 0, secret: dispSecret 
                }
            });

            if (!created && req.body.idExternoDispositivo != disp.dataValues.idExternoDispositivo) {
                logger.info(`Nuevo idExternoDispositivo ${req.body.idExternoDispositivo} del dispositivo con id ${disp.dataValues.id}`);
                await db.sequelize.models.Dispositivo.update({ idExternoDispositivo: req.body.idExternoDispositivo }, {
                    where: {
                        id: disp.dataValues.id
                    }
                });
            }
            
            const respuesta = {
                id: disp.id,
                nombre: req.body.nombre,
                espacioId: req.body.espacioId,
                idExternoDispositivo: req.body.idExternoDispositivo,
                creadoEn: disp.creadoEn,
                creadoPor: disp.creadoPor,
                actualizadoEn: disp.actualizadoEn,
                actualizadoPor: disp.actualizadoPor,
                endpointSeguimiento: endpointSeguimiento,
                totpConfig: {
                    t0: 0,
                    secret: disp.secret
                },
                epoch: moment.unix()
            }

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
    else {
        res.status(422).send('Datos no válidos');
    }    
}

async function getDispositivoById(req, res, db) {

    let idDispositivo = Number(req.params.idDispositivo);
    if (!Number.isInteger(idDispositivo)) {
        res.status(400).send('Id suministrado no válido');
        return;
    }
        
    const transaction = await db.sequelize.transaction();
        
    try {
        logger.info('Searching in Dispositivo for all columns');
        const query = await db.sequelize.models.Dispositivo.findOne({
            attributes: { exclude: [] },
            where: {
                id: req.params.idDispositivo
            }
        });

        if (query == null || Object.keys(query.dataValues).length == 0) {
            res.status(404).send('Dispositivo no encontrado');
            await transaction.rollback();
            return;
        }
            
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(query.dataValues);
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }                                                                                                                                                                   
        
    await transaction.commit();   
}

async function deleteDispositivo(req, res, db) {
    
    let idDispositivo = Number(req.params.idDispositivo);
    if (!Number.isInteger(idDispositivo)) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();

    try {
        logger.info('Searching in Dispositivo for id');
        const query = await db.sequelize.models.Dispositivo.findOne({
            attributes: ['id'],
             where: {
                id: idDispositivo
            }
        });
                    
        if (query == null || Object.keys(query.dataValues).length == 0) {
            res.status(404).send('Dispositivo no encontrado');
            await transaction.rollback();
            return;
        }
            
        await db.sequelize.models.Dispositivo.destroy({
            where: {
                id: query.dataValues.id
            }
        });
        
        res.status(204).send('Operación exitosa');
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }

    await transaction.commit();    
}

async function getLocalTime(req, res, db) {
    
    const resultado = {
        epoch: Math.floor(new Date().getTime() / 1000)
    }

    logger.info(`Pong! ${resultado.epoch}`);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(resultado);    
}

module.exports = {
    getDispositivos, creaDispositivo, getDispositivoById, deleteDispositivo, getLocalTime
}