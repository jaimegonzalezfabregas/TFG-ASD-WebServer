const logger = require('../../config/logger.config').child({"process": "api"});

const moment = require('moment');
const { authenticator } = require('otplib');

async function getDispositivos(req, res, next, db) {

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
        await transaction.rollback();
        let err = {};
        err.status = 500;
        err.message = 'Something went wrong';
        return next(err);
    }

    await transaction.commit();    
}

async function creaDispositivo(req, res, next, db, api_config) {
    if (req.body != null && Object.keys(req.body).length == 3 && req.body.nombre != null && req.body.espacioId != null && req.body.idExternoDispositivo != null) {

        if (!Number.isInteger(req.body.espacioId) || typeof req.body.nombre != 'string' || typeof req.body.idExternoDispositivo != 'string') {
            let err = {};
            err.status = 422;
            err.message = 'Datos no válidos';
            return next(err);
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
            await transaction.rollback();
            let err = {};
            err.status = 500;
            err.message = 'Something went wrong';
            return next(err);
        }

        await transaction.commit();
    } 
    else {
        let err = {};
        err.status = 422;
        err.message = 'Datos no válidos';
        return next(err);
    }    
}

async function getDispositivoById(req, res, next, db) {

    let idDispositivo = Number(req.params.idDispositivo);
    if (!Number.isInteger(idDispositivo)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
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
            let err = {};
            err.status = 404;
            err.message = 'Dispositivo no encontrado';
            return next(err);
        }
            
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(query.dataValues);
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        await transaction.rollback();
        let err = {};
        err.status = 500;
        err.message = 'Something went wrong';
        return next(err);
    }                                                                                                                                                                   
        
    await transaction.commit();   
}

async function deleteDispositivo(req, res, next, db) {
    
    let idDispositivo = Number(req.params.idDispositivo);
    if (!Number.isInteger(idDispositivo)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
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
            
        await transaction.rollback();
        let err = {};
        err.status = 404;
        err.message = 'Dispositivo no encontrado';
        return next(err);
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
        await transaction.rollback();
        let err = {};
        err.status = 500;
        err.message = 'Something went wrong';
        return next(err);
    }

    await transaction.commit();    
}

async function getLocalTime(req, res, next, db) {
    
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