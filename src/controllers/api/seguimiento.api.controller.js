const { Op } = require("sequelize");
const { authenticator } = require('otplib');
const moment = require('moment');
const recurrence_tool = require('../../parse_fecha');

const valoresAsistencia = ['Asistida', 'Asistida con Irregularidad', 'No Asistida'];

async function registroAsistencia(req, res, db) {

    console.log(req.body);

    if (Object.keys(req.body).length > 0 && req.body.tipo_registro != null && req.body.espacioId != null && Number.isInteger(req.body.espacioId)) {

        switch (req.body.tipo_registro) {
            // IMPORTANTE: METODO AUXILIAR SOLO PARA USAR EN PRUEBAS, PARA PODER ASISTIR SIN TENER QUE PASAR EL TOTP DE LOS DISPOSITIVOS
            case "RegistroSeguimientoFormulario": 
                if (req.body.usuarioId != null && Number.isInteger(req.body.usuarioId) && req.body.estado != null && valoresAsistencia.includes(req.body.estado)) {

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

                        await db.sequelize.models.Asistencia.create({ 
                            docente_id: req.body.usuarioId, 
                            espacio_id: req.body.espacioId, 
                            fecha: req.body.fecha || db.sequelize.fn('NOW'), 
                            estado: req.body.estado,
                            motivo: req.body.motivo || null
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

                        await db.sequelize.models.Asistencia.create({ 
                            docente_id: req.body.usuarioId, 
                            espacio_id: req.body.espacioId, 
                            fecha: db.sequelize.fn('NOW'), 
                            estado: req.body.estado
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

                        console.log('Docente de la MAC', query_user);
                        
                        if (query_user == null || Object.keys(query_user.dataValues).length == 0) {
                            res.send(404, 'Usuario no encontrado');
                            await transaction.rollback();
                            return;
                        }

                        // authenticator.options = { epoch: req.body.totp.time, digits: 6, step: 60, window: [10, 0] };
                        // if (!authenticator.verify({token: req.body.totp.value.toString(), secret: query_disp.dataValues.secret})) {
                        //     res.status(422).send('Datos no válidos');
                        //     await transaction.rollback();
                        //     return;
                        // }

                        let checkEstado = checkEstadoAsistencia(query_user.dataValues.id, req.body.espacioId);

                        await db.sequelize.models.Asistencia.findOrCreate({
                            where: {
                                docente_id: query_user.dataValues.id, 
                                espacio_id: req.body.espacioId,
                                estado: {
                                    [Op.or]: [valoresAsistencia[0], valoresAsistencia[1]]
                                },
                                fecha: {
                                    [Op.and]: [{ [Op.gte]: x }, { [Op.lte]: y }]
                                }
                            }, 
                            order: [['creadoEn', 'DESC']],
                            defaults: {
                                docente_id: query_user.dataValues.id, 
                                espacio_id: req.body.espacioId, 
                                fecha: db.sequelize.fn('NOW'), 
                                estado: (checkEstado) ? valoresAsistencia[0] : valoresAsistencia[1]
                            }
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
                        
                        let checkEstado = checkEstadoAsistencia(query_user.dataValues.id, req.body.espacioId);

                        await db.sequelize.models.Asistencia.create({ 
                            docente_id: req.body.usuarioId, 
                            espacio_id: req.body.espacioId, 
                            fecha: db.sequelize.fn('NOW'), 
                            estado: (checkEstado) ? valoresAsistencia[0] : valoresAsistencia[1]
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

        const comienzo = (req.body.comienzo == null)? moment().subtract(30, 'minutes').format('HH:mm') : req.body.comienzo;
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
                for (let i = 0; i < query_act.length; i++) {
                    let act = query_act[i];
                    if ((act.dataValues.tiempo_inicio <= comienzo && act.dataValues.tiempo_fin >= comienzo) 
                        || (act.dataValues.tiempo_inicio <= fin && act.dataValues.tiempo_fin >= fin)) {
                            
                        let cancelada = false;
                        
                        const excepciones_act = await db.sequelize.models.Excepcion.findAll({
                            attributes: ['fecha_inicio_act'],
                            where: {
                                actividad_id: act.dataValues.id,
                                esta_cancelado: 'Sí'
                            }
                        });

                        excepciones_act.forEach(ex => {
                            if (moment(ex.dataValues.fecha_inicio_act).format('YYYY-MM-DD') == moment().format('YYYY-MM-DD')) {
                                cancelada = true;
                            }
                        });

                        if (!cancelada) {
                            actividades.push(act.dataValues.id);
                        }
                    }
                }

                let comienzo_moment = moment(comienzo, 'HH:mm');
                let fin_moment = moment(fin, 'HH:mm')
                let ahora_comienzo = moment().hours(comienzo_moment.hours()).minutes(comienzo_moment.minutes()).format('YYYY-MM-DD HH:mm:00');
                let ahora_fin = moment().hours(fin_moment.hours()).minutes(fin_moment.minutes()).format('YYYY-MM-DD HH:mm:00');
                
                const reprogramaciones_act = await db.sequelize.models.Excepcion.findAll({
                    attributes: ['actividad_id'],
                    where: {
                        esta_cancelado: 'No',
                        esta_reprogramado: 'Sí',
                        fecha_inicio_ex: { [Op.lte]: ahora_comienzo },
                        fecha_fin_ex: { [Op.gte]: ahora_fin }
                    }
                });

                reprogramaciones_act.forEach(reprog => {
                    actividades.push(reprog.dataValues.actividad_id);
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

    filtroEstado = req.body.estado || null;
    filtroMotivo = req.body.motivo || null;
    filtroFecha = moment(req.body.fecha, 'YYYY-MM-DD').format('YYYY-MM-DD 00:00:00');
    filtroEspacio = req.body.espacioId || null;

    let fechaSiguiente = moment(req.body.fecha, 'YYYY-MM-DD').add(1, 'days').format('YYYY-MM-DD 00:00:00');

    const transaction = await db.sequelize.transaction();

    try {
        const query_asist = await db.sequelize.models.Asistencia.findAll({
            attributes: ['id'],
            where: {
                [Op.and]: [
                    (filtroEstado != null) ? { estado: filtroEstado } : {},
                    (filtroMotivo != null) ? { [Op.and]: [(filtroMotivo == 'Sí') ? { motivo: { [Op.not]: null } } : {motivo: { [Op.is]: null } }] } : {},
                    (req.body.fecha != null) ? { fecha: { [Op.gte]: filtroFecha } } :  {},
                    (req.body.fecha != null) ? { fecha: { [Op.lte]: fechaSiguiente }} : {},
                    (filtroEspacio != null) ? { espacio_id: filtroEspacio } : {},
                ]
            }
        });
        
        let respuesta = { asistencias: [] }

        console.log(query_asist);
        if (query_asist.length > 0) {
            query_asist.forEach((asist) => {
                respuesta.asistencias.push(asist.dataValues);
            }); 
        }

        console.log(respuesta);
    
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

        let update_data = {}
        if (req.body.estado != null) update_data.estado = req.body.estado;
        if (req.body.motivo != null) update_data.motivo = req.body.motivo;

        const nueva_asist = await db.sequelize.models.Asistencia.update(update_data, {
            where: {
                id: idAsistencia
            }
        });

        let resultado = query_asist.dataValues;
        if (req.body.estado != null) {
            update_data.estado = req.body.estado; 
            resultado.estado = req.body.estado;
        }
        if (req.body.motivo != null) {
            update_data.motivo = req.body.motivo;
            resultado.motivo = req.body.motivo;
        }

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

async function checkEstadoAsistencia(docenteId, espacioId) {

    const transaction = await db.sequelize.transaction();

    try {
                    
        // Comprobar que en la hora actual ese profesor tenga una asignatura en ese espacio para validar el estado
        const query_act = await db.sequelize.models.Actividad.findAll({
            attributes: ['id', 'tiempo_inicio', 'tiempo_fin', 'es_recurrente', 'fecha_inicio', 'fecha_fin'],
            include: {
                model: db.sequelize.models.Docente,
                where: {
                    id: docenteId
                } 
            },
            include: {
                model: db.sequelize.models.Espacio,
                where: {
                    id: espacioId
                }
            }
        });
                            
        for (let i = 0; i < query_act.length; i++) {
            const act = query_act[i].dataValues;
            // Comprobar si existe excepcion que este reprogramada para hoy
            // Si esta cancelada, pasamos de ella
            const query_ex = db.sequelize.models.Excepcion.findAll({
                attributes: ['esta_cancelado', 'esta_reprogramado', 'fecha_inicio_act', 'fecha_fin_act', 'fecha_inicio_ex', 'fecha_fin_ex'],
                where: {
                    actividad_id: act.id
                }
            });


            let ignore_actividad = false;
            for (let j = 0; j < query_ex; j++) {
                let excep = query_ex[j].dataValues;
                let a_comparar = moment().format('DD/MM/YYYY HH:mm');
                //Está reprogramado para ahora, y no cancelado (está antes en el if para comprobar casos de desplazamientos menores que la duración del evento original)
                if (excep.esta_cancelado == 'No' && excep.esta_reprogramado == 'Sí' && 
                    moment(excep.fecha_inicio_ex).format('DD/MM/YYYY HH:mm') >= a_comparar &&
                    moment(excep.fecha_fin_ex).format('DD/MM/YYYY HH:mm') <= a_comparar) {
                        actividades_posibles.push(act);
                        break;
                } //Está cancelada la instancia de ahora o se ha reprogamado para otro día
                else if ((excep.esta_cancelado == 'Sí' || excep.esta_reprogramado == 'Sí') && 
                    moment(excep.fecha_inicio_act).format('DD/MM/YYYY HH:mm') >= a_comparar &&
                    moment(excep.fecha_fin_act).format('DD/MM/YYYY HH:mm') <= a_comparar) {
                        ignore_actividad = true;
                        break;
                }
            }

            if (ignore_actividad) continue;

            // Si no tiene excepcion para este día
            const currentHour = moment().format('HH:mm');
            const inicio = moment(act.tiempo_inicio, 'HH:mm');
            const fin = moment(act.tiempo_fin, 'HH:mm');
            if (inicio <= currentHour && currentHour <= fin) {
                if (act.es_recurrente == 'Sí') {
                    const query_rec = await db.sequelize.models.Recurrencia.findAll({
                        where: {
                            actividad_id: act.id
                        }
                    });
        
                    query_rec.forEach(rec => {
                        rec_list.push(rec.dataValues)
                    });
                                        
                    let last = recurrence_tool.getLastEventOfActividad(act, rec_list);
                    // Si está en el día de hoy, Asistida, si no, la ignoramos
                    if (moment(last).format('DD/MM/YYYY') == moment().format('DD/MM/YYYY')) {
                        actividades_posibles.push(act);
                    }
        
                }
                else if (moment(act.fecha_inicio).format('DD/MM/YYYY') == moment().format('DD/MM/YYYY')) {
                    actividades_posibles.push(act);
                }
            }
        }
    }
    catch (error) {
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }
       

    await transaction.commit();

    return actividades_posibles > 0;
}