const { Op } = require("sequelize");
const moment = require('moment');

async function getDispositivos(req, res, db) {

    const transaction = await db.sequelize.transaction();
    
    try {
        console.log('Searching in Dispositivo for id, nombre, espacioId, idExternoDispositivo');
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
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }

    await transaction.commit();    
}

async function creaDispositivo(req, res, db) {
    console.log("Recibido post dispositivos", req.body);
    if (req.body != null && Object.keys(req.body).length == 3 && req.body.nombre != null && req.body.espacioId != null && req.body.idExternoDispositivo != null) {

        if (!Number.isInteger(req.body.espacioId) || typeof req.body.nombre != 'string' || typeof req.body.idExternoDispositivo != 'string') {
            res.status(422).send('Datos no válidos');
            return;
        }
        console.log("Post dispositivos con datos válidos");
        
        const transaction = await db.sequelize.transaction();

        try {   
            const endpointSeguimiento = 'http://' + api_config.host + ':' + api_config.port + api_path + '/seguimiento';
            const dispSecret = authenticator.generateSecret();
            console.log(`Post dispositivos datos a pasar: ${endpointSeguimiento}, ${dispSecret}`);

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
                console.log(`Nuevo idExternoDispositivo ${req.body.idExternoDispositivo} del dispositivo con id ${disp.dataValues.id}`);
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
                    secret: dispSecret
                },
                epoch: moment.unix()
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
    else {
        res.status(422).send('Datos no válidos');
    }    
}

async function getDispositivoById(req, res, db) {

    let idDispositivo = null;

    try{
        idDispositivo = Number(req.params.idDispositivo);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }
        
    const transaction = await db.sequelize.transaction();
        
    try {
        console.log('Searching in Dispositivo for all columns');
        const query = await db.sequelize.models.Dispositivo.findOne({
            attributes: { exclude: [] },
            where: {
                espacioId: req.params.idDispositivo
            }
        });

        if (Object.keys(query.dataValues).length == 0) {
            res.status(404).send('Dispositivo no encontrado');
            await transaction.rollback();
            return;
        }
            
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(query.dataValues);
    }
    catch (error) {
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }                                                                                                                                                                   
        
    await transaction.commit();   
}

async function deleteDispositivo(req, res, db) {
    
    let idDispositivo = null;
            
    try{
        idDispositivo = Number(req.params.idDispositivo);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();

    try {
        console.log('Searching in Dispositivo for id');
        const query = await db.sequelize.models.Dispositivo.findOne({
            attributes: ['id'],
             where: {
                    espacioId: req.params.idDispositivo
        }
        });
                    
        if (Object.keys(query.dataValues).length == 0) {
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
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }

    await transaction.commit();    
}

async function getLocalTime(req, res, db) {
    
    const resultado = {
        epoch: moment.unix()
    }

    console.log("Pong!", resultado);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(resultado);    
}


module.exports = {
    getDispositivos, creaDispositivo, getDispositivoById, deleteDispositivo, getLocalTime
}