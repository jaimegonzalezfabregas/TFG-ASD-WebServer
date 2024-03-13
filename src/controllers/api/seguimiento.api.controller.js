const { Op } = require("sequelize");
const { authenticator } = require('otplib');
const moment = require('moment');
const valoresAsistencia = ['Asistida', 'Asistida con Irregularidad', 'No Asistida'];

async function registroAsistencia(req, res, db) {

    console.log(req.body);

    if (Object.keys(req.body).length > 0 && req.body.tipo_registro != null && req.body.espacioId != null && Number.isInteger(req.body.espacioId)) {

        switch (req.body.tipo_registro) {
            case "RegistroSeguimientoFormulario": 
                if (req.body.usuarioId != null && Number.isInteger(req.body.usuarioId)) {

                    const transaction = await db.sequelize.transaction();

                    try {
                        console.log('Searching in Docente for id');
                        const query_user = await db.sequelize.models.Docente.findOne({
                            attributes: ['id'],
                            where: {
                                id: req.body.usuarioId
                            }
                        })
                        
                        if (query_user == null || Object.keys(query_user.dataValues).length == 0) {
                            res.send(404, 'Usuario no encontrado');
                            await transaction.rollback();
                            return;
                        }

                        await db.sequelize.models.Asistencia.create({ docente_id: req.body.usuarioId, espacio_id: req.body.espacioId, fecha: db.sequelize.fn('NOW'), estado: req.body.estado});

                        await transaction.commit();
                    }
                    catch (error) {
                        console.log('Error while interacting with database:', error);
                        res.status(500).send('Something went wrong');
                        await transaction.rollback();
                        return;
                    }
                }
                else {
                    res.status(422).send('Datos no válidos');
                    return;
                }
            break;
            case "RegistroSeguimientoUsuario":
                if (req.body.usuarioId != null && Number.isInteger(req.body.usuarioId)) {

                    const transaction = await db.sequelize.transaction();

                    try {
                        console.log('Searching in Dispositivo for id');
                        const query_disp = await db.sequelize.models.Dispositivo.findAll({ // Si hay más de un dispositivo habría que comprobar todos
                            attributes: ['id', 'secret'],
                            where: {
                                espacioId: req.body.espacioId
                            }
                        });

                        if (query_disp.length == 0) {
                            res.status(404).send('Dispositivo no encontrado');
                            await transaction.rollback();
                            return;
                        }

                        console.log('Searching in Docente for id');
                        const query_user = await db.sequelize.models.Docente.findOne({
                            attributes: ['id'],
                            where: {
                                id: req.body.usuarioId
                            }
                        })
                        
                        if (query_user == null || Object.keys(query_user.dataValues).length == 0) {
                            res.send(404, 'Usuario no encontrado');
                            await transaction.rollback();
                            return;
                        }
                        
                        let valid = false;
                        authenticator.options = { digits: 6, step: 60, window: [10, 0] };
                        query_disp.forEach(async (disp) => {
                            if (authenticator.verify({token: req.body.totp, secret: disp.dataValues.secret})) {
                                valid = true;
                            }
                        });

                        if (!valid) {
                            res.status(422).send('Datos no válidos');
                            await transaction.rollback();
                            return;
                        }

                        await db.sequelize.models.Asistencia.create({ docente_id: req.body.usuarioId, espacio_id: req.body.espacioId, fecha: db.sequelize.fn('NOW'), estado: "Asistida"});

                        await transaction.commit();
                    }
                    catch (error) {
                        console.log('Error while interacting with database:', error);
                        res.status(500).send('Something went wrong');
                        await transaction.rollback();
                        return;
                    }
                }
                else {
                    res.status(422).send('Datos no válidos');
                    return;
                }
            break;
            case "RegistroSeguimientoDispositivoBle":
                if (req.body.mac != null && req.body.espacioId != null && Number.isInteger(req.body.espacioId)
                    && req.body.dispositivoId != null && Number.isInteger(req.body.dispositivoId)) {

                    const transaction = await db.sequelize.transaction();

                    try {
                        console.log('Searching in Dispositivo for id');
                        const query_disp = await db.sequelize.models.Dispositivo.findOne({ // Si hay más de un dispositivo habría que comprobar todos
                            attributes: ['id', 'secret'],
                            where: {
                                espacioId: req.body.espacioId
                            }
                        });
                                
                        if (query_disp == null || Object.keys(query_disp.dataValues).length == 0) {
                            res.status(404).send('Dispositivo no encontrado');
                            await transaction.rollback();
                            return;
                        }

                        console.log('Searching in Docente for id');
                        const query_user = await db.sequelize.models.Docente.findOne({
                            attributes: ['id'],
                            include: {
                                model: db.sequelize.models.Macs,
                                as: 'con_mac',
                                where: {
                                    mac: req.body.mac
                                }
                            }
                        });
                        
                        if (query_user == null || Object.keys(query_user.dataValues).length == 0) {
                            res.send(404, 'Usuario no encontrado');
                            await transaction.rollback();
                            return;
                        }
                        
                        // Comprobar que en la hora actual ese profesor tenga una asignatura en ese espacio para validar el estado

                        // authenticator.options = { epoch: req.body.totp.time, digits: 6, step: 60, window: [10, 0] };
                        // if (!authenticator.verify({token: req.body.totp.value.toString(), secret: query_disp.dataValues.secret})) {
                        //     res.status(422).send('Datos no válidos');
                        //     await transaction.rollback();
                        //     return;
                        // }

                        await db.sequelize.models.Asistencia.findOrCreate({
                            where: {
                                docente_id: query_user.dataValues.id, 
                                espacio_id: req.body.espacioId,
                                estado: {
                                    [Op.or]: [valoresAsistencia[0], valoresAsistencia[1]]
                                },
                                fecha: db.sequelize.fn('NOW')
                                // Revisar que la fecha sea de la actividad actual
                            }, 
                            order: ['creadoEn', 'DESC']
                        },
                        {
                            docente_id: query_user.dataValues.id, 
                            espacio_id: req.body.espacioId, 
                            fecha: db.sequelize.fn('NOW'), 
                            estado: "Asistida"
                        });

                        await transaction.commit();
                    }
                    catch (error) {
                        console.log('Error while interacting with database:', error);
                        res.status(500).send('Something went wrong');
                        await transaction.rollback();
                        return;
                    }
                }
                else {
                    res.status(422).send('Datos no válidos');
                    return;
                }
            break;
            case "RegistroSeguimientoDispositivoQr":
            break;
            case "RegistroSeguimientoDispositivoNFC":
                if (req.body.uid != null) {

                    const transaction = await db.sequelize.transaction();

                    try {
                        console.log('Searching in Dispositivo for id');
                        const query_disp = await db.sequelize.models.Dispositivo.findAll({ // Si hay más de un dispositivo habría que comprobar todos
                            attributes: ['id', 'secret'],
                            where: {
                                espacioId: req.body.espacioId
                            }
                        });

                        if (query_disp.length == 0) {
                            res.status(404).send('Dispositivo no encontrado');
                            await transaction.rollback();
                            return;
                        }

                        console.log('Searching in Docente for id');
                        const query_user = await db.sequelize.models.Docente.findOne({
                            attributes: ['id'],
                            include: {
                                model: db.sequelize.models.Nfcs,
                                as: 'con_nfc',
                                where: {
                                    nfc: parseInt(req.body.uid)
                                }
                            }
                        });
                        
                        if (query_user == null || Object.keys(query_user.dataValues).length == 0) {
                            res.send(404, 'Usuario no encontrado');
                            await transaction.rollback();
                            return;
                        }
                        
                        // let valid = false;
                        // authenticator.options = { digits: 6, step: 60, window: [10, 0] };
                        // query_disp.forEach(async (disp) => {
                        //     if (authenticator.verify({token: req.body.totp, secret: disp.dataValues.secret})) {
                        //         valid = true;
                        //     }
                        // });

                        // if (!valid) {
                        //     res.status(422).send('Datos no válidos');
                        //     await transaction.rollback();
                        //     return;
                        // }

                        await db.sequelize.models.Asistencia.create({ docente_id: req.body.usuarioId, espacio_id: req.body.espacioId, fecha: db.sequelize.fn('NOW'), estado: "Asistida"});

                        await transaction.commit();
                    }
                    catch (error) {
                        console.log('Error while interacting with database:', error);
                        res.status(500).send('Something went wrong');
                        await transaction.rollback();
                        return;
                    }
                }
                else {
                    res.status(422).send('Datos no válidos');
                    return;
                }
            break;
        }
     
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send({ resultado: 'correcto' });
    }
    else {
        res.status(422).send('Datos no válidos');
        return;
    }    
}

async function getMacsBLE(req, res, db) {
    console.log(req.body);
    if (Object.keys(req.body).length > 0 && req.body.espacioId != null) {
        try {
            espId = parseInt(req.body.espacioId);
        }
        catch {
            res.status(400).send("Id suministrado no válido");
            return;
        }

        const comienzo = (req.body.comienzo == null)? moment().subtract(30, 'minutes').format('HH:mm') : req.body.comienzo; //Revisar format
        const fin = (req.body.fin == null)? moment().add(30, 'minutes').format('HH:mm') : req.body.fin;

        const transaction = await db.sequelize.transaction();
        
        try {
            console.log('Searching in Espacio for id');
            const query_esp = await db.sequelize.models.Espacio.findOne({
                attributes:['id'],
                where: {
                    id: espId
                }
            });

            // Comprobamos que el espacio exista en la base de datos
            if (Object.keys(query_esp.dataValues).length == 0) {
                res.status(404).send('Espacio no encontrado');
                await transaction.rollback();
                return;
            }
        
            let respuesta = { macs: [] };
            let actividades = []
        
            console.log('Searching in Actividad for id');
            const query_act = await db.sequelize.models.Actividad.findAll({
                attributes:['id', 'tiempo_inicio', 'tiempo_fin'],
                include: {
                    model: db.sequelize.models.Espacio,
                    as: 'impartida_en',
                    where: {
                        id: espId
                    }
                }
            });
                
            // Si tiene actividades
            if (query_act.length != 0) {
                query_act.forEach((act) => { //Tener en cuenta recurrencias
                    if ((act.dataValues.tiempo_inicio <= comienzo && act.dataValues.tiempo_fin >= comienzo) 
                        || (act.dataValues.tiempo_inicio <= fin && act.dataValues.tiempo_fin >= fin)) {
                        actividades.push(act.dataValues.id);
                    }
                });
                
                console.log(actividades);

                const query_macs = await db.sequelize.models.Macs.findAll({
                    attributes: ['usuario_id', 'mac'],
                    include: {
                        model: db.sequelize.models.Docente,
                        as: 'asociado_a',
                        include: {
                            model: db.sequelize.models.Actividad,
                            as: 'imparte',
                            where: {
                                id: {
                                    [Op.or]: actividades
                                }
                            }
                        }
                    }
                });

                console.log(query_macs.dataValues);

                // Si tiene MACs
                if (query_macs.length != 0) {
                    query_macs.forEach((mac) => {
                        respuesta.macs.push(mac.dataValues.mac);
                    });

                    console.log(respuesta.macs);
                }
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
        res.status(422).send("Datos no válidos");
    }
}

async function getAsistencias(req, res, db) {
    let filtroEstado = null;
    let filtroMotivo = null;
    //let filtroFecha = null;

    if (req.body != null) {
        filtroEstado = req.body.estado || null;
        filtroMotivo = req.body.motivo || null;
        //filtroFecha = req.body.fecha || moment().format('YYYY-MM-DD');
    }

    const transaction = await db.sequelize.transaction();

    try {
        const query_asist = await db.sequelize.models.Asistencia.findAll({
            attributes: ['id'],
            where: {
                [Op.and]: [
                    (filtroEstado != null) ? { estado: filtroEstado } : {},
                    (filtroMotivo != null) ? { [Op.and]: [(filtroMotivo == 'Sí') ? { motivo: { [Op.not]: null } } : {motivo: { [Op.is]: null } }] } : {},
                ]
            }
        });
        
        let respuesta = { asistencias: [] }

        console.log(query_asist);
        if (query_asist.length > 0) {
            query_asist.forEach((asist) => {
                respuesta.asistencias.push(asist.dataValues.id);
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
    
}

async function getAsistenciaById(req, res, db) {
    let idAsistencia = null;
    try {
        idAsistencia = Number(req.params.idAsistencia);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();

    try {
        console.log('Searching in Asistencia for id, docente_id, espacio_id, fecha, estado, motivo');
        const query_asist = await db.sequelize.models.Asistencia.findOne({
            attributes:['id', 'fecha', 'docente_id', 'espacio_id', 'estado', 'motivo'],
            where: {
                id: idAsistencia
            }
        });

        if (Object.keys(query_asist.dataValues).length == 0) {
            res.status(404).send('Asistencia no encontrada');
            await transaction.rollback();
            return;
        }

        const resultado = { 
            id: query_asist.id, fecha: query_asist.fecha,
            motivo: query_asist.motivo, docenteId: query_asist.docente_id,
            espacioId: query_asist.espacio_id, query_asist: query_asist.estado
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

async function updateAsistenciaById(req, res, db) {
    let idAsistencia = null;
    try {
        idAsistencia = Number(req.params.idAsistencia);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();

    try {
        console.log('Searching in Asistencia for id, docente_id, espacio_id, fecha, estado, motivo');
        const query_asist = await db.sequelize.models.Asistencia.findOne({
            attributes:['id', 'fecha', 'docente_id', 'espacio_id', 'estado', 'motivo'],
            where: {
                id: idAsistencia
            }
        });

        if (Object.keys(query_asist.dataValues).length == 0) {
            res.status(404).send('Asistencia no encontrada');
            await transaction.rollback();
            return;
        }

        const nueva_asist = await db.sequelize.models.Asistencia.update({motivo: req.body.motivo}, {
            where: {
                id: idAsistencia
            }
        });

        let resultado = nueva_asist.dataValues;

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
    registroAsistencia, getMacsBLE, getAsistencias, getAsistenciaById, updateAsistenciaById
}