const express = require('express');
const path = require('path');
const { Op } = require ('sequelize');
const moment = require('moment');
const { authenticator, totp } = require('otplib');
const bcrypt = require('bcrypt');
const db = require('./models');
const app = express();
// Rutas de la API
const api_path = '/api/v1';
const api_config = require('./config/api.config');

const spices = [
    "inOPPh4IThFNhRF0",
    "rYYzv9VdRixlne1k",
    "j8XT8s3IsGqTNrYJ",
    "2CkN3WNmw9ZtkZ0p",
    "1EievW4P3Cn1dgvZ",
    "EXQgyv6DYck0thU8",
    "DHetHwn1uzphv0Gu",
    "TGZbU4V6klXw8hHe",
    "Oxi8DnH6KVXytWFB",
    "Gfx7HYNlCLr5KEaQ"
]

app.use(express.json());

app.get(api_path + '/espacios', async (req, res) => {
    /*
        tags:
            - espacios
        summary: Devuelve los espacios gestionados
        description: Devuelve una lista de espacios
        operationId: getEspacios
        responses:
            '200':
                $ref: '#/components/responses/ListaEspacios'
        security:
            - ApiKeyAuth: []
    */
    console.log(db);
    const transaction = await db.sequelize.transaction();
    
    try {
        console.log('Searching in Espacio for id, numero, tipo, edificio');
        console.log(`${JSON.stringify(db.sequelize.models)} ${db.sequelize.models.Espacio}`)
        const query = await db.sequelize.models.Espacio.findAll({
            attributes:['id', 'tipo', 'numero', 'edificio']
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
});

// /espacios/{idEspacio}
app.get(api_path + '/espacios/:idEspacio', async (req, res) => {
    /* 
        tags:
            - espacios
        summary: Devuelve los detalles de un espacio
        description: Devuelve un espacio
        operationId: getEspacioById
        parameters:
            - $ref: '#/components/parameters/idEspacio'
        responses:
            '200':
                $ref: '#/components/responses/Espacio'
        security:
            - ApiKeyAuth: []
    */

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

});

// /dispositivos
app.get(api_path + '/dispositivos', async (req, res) => {
    /*
        tags:
            - dispositivos
        summary: Devuelve los dispositivos gestionados
        description: Devuelve una lista de dispositivos
        operationId: getDispositivos
        responses:
            '200':
                $ref: '#/components/responses/ListaDispositivos'
        security:
            - ApiKeyAuth: []
    */

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
    
});

app.post(api_path + '/dispositivos', async (req, res) => {
    /*
        tags:
            - dispositivos
        summary: Añade un nuevo dispositivo
        description: Añade una nuevo dispositivo al sistema
        operationId: creaDispositivo
        requestBody:
            $ref : '#/components/requestBodies/DispositivoNuevo'
        responses:
            '200':
                $ref: '#/components/responses/Dispositivo'
            '422':
                description: Datos no válidos
        security:
            - ApiKeyAuth: []
    */
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
    
});

// /dispositivos/{idDispositivo}
app.get(api_path + '/dispositivos/:idDispositivo', async (req, res) => {
    /*
        tags:
            - dispositivos
        summary: Busca un dispositivo por su id
        description: Devuelve un dispositivo
        operationId: getDispositivoById
        parameters:
            - $ref: '#/components/parameters/idDispositivo'
        responses:
            '200':
                $ref: '#/components/responses/Dispositivo'
            '400':
                description: Id suministrado no válido
            '404':
                description: Dispositivo no encontrado
        security:
            - ApiKeyAuth: []
    */

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
    
});

app.delete(api_path + '/dispositivos/:idDispositivo', async (req, res) => {
    /*
        tags:
            - dispositivos
        summary: Borra un dispositivo
        description: Borr un dispositivo
        operationId: deleteDispositivo
        parameters:
            - $ref: '#/components/parameters/idDispositivo'
        responses:
            '204':
                description: Operación exitosa
            '400':
                description: Id suministrado no válido
            '404':
                description: Dispositivo no encontrado
        security:
            - ApiKeyAuth: []
    */
    
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

});

// /ping
app.get(api_path + '/ping', (req, res) => {
    /*
        tags:
            - dispositivos
        summary: Devuelve la hora
        description: Devuelve la hora actual al dispositivo
        operationId: getLocalTime
        responses:
            '200':
            $ref: '#/components/responses/TimestampActual'
    */
    
    const resultado = {
        epoch: moment.unix()
    }

    console.log("Pong!", resultado);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(resultado);
   
});

// /seguimiento
app.post(api_path + '/seguimiento',  async (req, res) => {
    /*
        tags:
            - seguimiento
        summary: Registra una asistencia en un espacio
        description: Registra una asistencia en un espacio
        operationId: registroAsistencia
        requestBody:
            $ref : '#/components/requestBodies/SeguimientoNuevo'
        responses:
            '200':
                $ref: '#/components/responses/ResultadoSeguimiento'
            '422':
                description: Datos no válidos
        security:
            - ApiKeyAuth: []
    */

    console.log(req.body);

    if (Object.keys(req.body).length != 0 && req.body.tipo_registro != null && req.body.espacioId != null && Number.isInteger(req.body.espacioId)) {

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
                            where: {
                                id: req.body.usuarioId
                            }
                        })
                        
                        if (query_user == null || Object.keys(query_user.dataValues).length == 0) {
                            res.send(404, 'Usuario no encontrado');
                            await transaction.rollback();
                            return;
                        }
                        
                        // Preguntar por window (totp.options = { window: 0 })
                        totp.options = { epoch: req.body.totp.time, digits: 6, step: 30, window: [1, 0] };
                        if (!totp.verify({token: req.body.totp.value.toString(), secret: query_disp.dataValues.secret})) {
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
            break;
            case "RegistroSeguimientoDispositivoQr":
            break;
            case "RegistroSeguimientoDispositivoNFC":
        }
     
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send({ resultado: 'correcto' });
    }
    else {
        res.status(422).send('Datos no válidos');
        return;
    }
});

// /ble
app.get(api_path + '/ble', async (req, res) => {
    /*
        tags:
            - seguimiento
        summary: Devuelve una lista de MACs de dispositivos BLE
        description: Develve la lista de MACs de dispositivos BLE para las actividades docentes a llevar a cabo en un espacio en una ventana de tiempo.
        operationId: getMacsBLE
        parameters:
            - in: query
                name: espacioId
                schema:
                    type: integer
                    format: int64
                required: true
                description: Id del espacio para filtrar la búsqueda
            - in: query
                name: comienzo
                schema:
                    type: string
                    format: date-time
                required: false
                description: Fecha y hora de comienzo para la la búsqueda. Si no se especifica, la ventana el comienzo serán 30 minutos antes de la hora actual del servidor al recibir la petición.
            - in: query
                name: fin
                schema:
                    type: string
                    format: date-time
                required: false
                description: Fecha y hora de fin para la la búsqueda. Si no se especifica, la ventana el comienzo serán 30 minutos después de la hora actual del servidor al recibir la petición.
        responses:
            '200':
                $ref: '#/components/responses/ListaMACsUsuarios'
            '400':
                description: Id suministrado no válido
            '404':
                description: Espacio no encontrado
            '422':
                description: Datos no válidos
        security:
            - ApiKeyAuth: []
    */

    console.log(req.query);
    if (Object.keys(req.query).length > 0 && req.query.espacioId != null) {
        try {
            espId = parseInt(req.query.espacioId);
        }
        catch {
            res.status(400).send("Id suministrado no válido");
            return;
        }

        const comienzo = (req.query.comienzo == null)? 30 : req.query.comienzo;
        const fin = (req.query.fin == null)? 30 : req.query.fin;

        const transaction = await db.sequelize.transaction();
        
        try {
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
                query_act.forEach((act) => {
                    if (act.dataValues.tiempo_inicio >= comienzo && act.dataValues.tiempo_fin <= fin) {
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
});

// /login
app.post(api_path + '/login', async(req, res) => {
    /*
        tags:
            - usuarios
        summary: Devuelve los parámetros de un usuario
        description: Dados un email y una contraseña válidas y en base de datos, devuelve los parámetros del usuario asociado
        operationId: loginUser
        requestBody:
            $ref : '#/components/requestBodies/LoginUsuario'
        responses:
            '200':
                $ref: '#/components/responses/UsuarioData'
            '422':
                description: Datos no válidos
        security:
            - ApiKeyAuth: []
    */

    const transaction = await db.sequelize.transaction();
    
    try {
        console.log('Searching in Docente for id, email, password, nombre, apellidos');

        const query = await db.sequelize.models.Docente.findOne({
            attributes: ['id', 'email', 'password', 'nombre', 'apellidos', 'rol'],
            where: {
                email: req.body.email
            }
        });
        
        if (query != null) {
            let valid = false;
            for (let i = 0; i < spices.length; i++) {
                if (bcrypt.compareSync(spices[i] + req.body.password, query.dataValues.password)) {
                    valid = true;
                    break;
                }
            }
            if (!valid) {
                throw error("Datos inválidos al hacer login");
            }
        }
        else {
            throw error("Datos inválidos al hacer login");
        }

        await transaction.commit();

        let resultado = JSON.stringify({id: query.dataValues.id, nombre: query.dataValues.nombre, apellidos: query.dataValues.apellidos, email: query.dataValues.email, rol: query.dataValues.rol});
        console.log('resultado:', resultado);
        res.status(200).send(resultado);

    }
    catch (error) {
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }
});

// /espacios/usuarios/{idUsuario}
app.post(api_path + '/espacios/usuarios/:idUsuario', async (req, res) => {
    /*
        tags:
            - usuarios
        summary: Devuelve cierta información de cierto usuario por su id
        description: Dada una opción, devuelve información relacionada a esta opción del usuario con id = {idUsuario}
        operationId: queryUser
        parameters:
            - $ref: '#/components/parameters/idUsuario'
        requestBody:
            $ref: '#/components/requestBodies/InfoUsuario'
        responses:
            '200':
                $ref: '#/components/responses/UsuarioInfoData'
            '400':
                description: Id suministrado no válido
            '404':
                description: Usuario no encontrado
            '422':
                description: Datos no válidos
    */

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

});

// /actividades/usuarios/:idUsuario
app.get(api_path + '/actividades/usuarios/:idUsuario', async (req, res) => {
    /*
        tags:
            - actividades
            - usuarios
        summary: Devuelve una lista de las actividades de un usuario por su id
        description: Devuelve una lista de las actividades del usuario con id = {idUsuario}.
        operationId: getActividadesOfUsuario
        parameters:
            - $ref: '#/components/parameters/idUsuario'
        responses:
            '200':
            $ref: '#/components/responses/ActividadUsuarioInfoData'
            '400':
            description: Id suministrado no válido
            '404':
            description: Usuario no encontrado
    */

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
                id: req.params.idUsuario
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
                    id: req.params.idUsuario 
                }
            },
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
});

// /actividades/:idActividad
app.get(api_path + '/actividades/:idActividad', async (req, res) => {
    /*
      tags:
        - actividades
      summary: Devuelve información sobre una actividad por su id
      description: Devuelve un json con parámetros informativos de la actividad con id = {idActividad}ç
      operationId: getActividadById
      parameters:
        - $ref: '#/components/parameters/idActividad'
      responses:
        '200':
          $ref: '#/components/responses/Actividad'
        '400':
          description: Id suministrado no válido
        '404':
          description: Actividad no encontrada
    */
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
                id: req.params.idActividad
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
});

// /actividades/espacios/:idEspacio
app.get(api_path + '/actividades/espacios/:idEspacio', async (req, res) => {
    /*
      tags:
        - actividades
        - espacios
      summary: Devuelve una lista de las actividades de un espacio por su id
      description: Devuelve una lista de las actividades del usuario con id = {idEspacio}.
      operationId: getActividadesOfEspacio
      parameters:
        - $ref: '#/components/parameters/idEspacio'
      responses:
        '200':
          $ref: '#/components/responses/ActividadEspacioInfoData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Espacio no encontrado
    */
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
                id: req.params.idEspacio
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
                    id: req.params.idEspacio
                }
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
});

// /clases/:idClase
app.get(api_path + '/clases/:idClase', async (req, res) => {
    /*
      tags:
        - clases
      summary: Devuelve información sobre una clase por su id
      description: Devuelve la asignatura y el grupo al que hace referencia la clase con id = {idClase}
      operationId: getClaseById
      parameters:
        - $ref: '#/components/parameters/idClase'
      responses:
        '200':
          $ref: '#/components/responses/ClaseData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Clase no encontrada      
    */
    try {
        idClase = Number(req.params.idClase);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        console.log('Searching in Clase for asignatura_id, grupo_id');
        const query_cla = await db.sequelize.models.Clase.findOne({
            attributes:['asignatura_id', 'grupo_id'],
            where: {
                id: req.params.idClase
            }
        });

        if (Object.keys(query_cla.dataValues).length == 0) {
            res.status(404).send('Clase no encontrada');
            await transaction.rollback();
            return;
        }

        const resultado = query_cla.dataValues;

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
});

// /asignaturas/:idAsignatura
app.get(api_path + '/asignaturas/:idAsignatura', async (req, res) => {
    /*
      tags:
        - asignaturas
      summary: Devuelve información de una asignatura por su id
      description: Devuelve información de la asignatura con id = {idAsignatura}
      operationId: getAsignaturaById
      parameters:
        - $ref: '#/components/parameters/idAsignatura'
      responses:
        '200':
          $ref: '#/components/responses/AsignaturaData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Asignatura no encontrada      
    */
    try {
        idAsignatura = Number(req.params.idAsignatura);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        console.log('Searching in Asignatura for nombre, siglas, departamento, periodo');
        const query_asig = await db.sequelize.models.Asignatura.findOne({
            attributes:['nombre', 'siglas', 'departamento', 'periodo'],
            where: {
                id: req.params.idAsignatura
            }
        });

        if (Object.keys(query_asig.dataValues).length == 0) {
            res.status(404).send('Asignatura no encontrada');
            await transaction.rollback();
            return;
        }

        const resultado = query_asig.dataValues;

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
});

// /grupos/:idGrupo
app.get(api_path + '/grupos/:idGrupo', async (req, res) => {
    /*
      tags:
        - grupos
      summary: Devuelve información de un grupo por su id
      description: Devuelve información del grupo con id = {idAsignatura}
      operationId: getGrupoById
      parameters:
        - $ref: '#/components/parameters/idGrupo'
      responses:
        '200':
          $ref: '#/components/responses/GrupoData'
        '400':
          description: Id suministrado no válido
        '404':
          description: Grupo no encontrado      
    */
    try {
        idGrupo = Number(req.params.idGrupo);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        console.log('Searching in Grupo for curso, letra');
        const query_gru = await db.sequelize.models.Grupo.findOne({
            attributes:['curso', 'letra'],
            where: {
                id: req.params.idGrupo
            }
        });

        if (Object.keys(query_gru.dataValues).length == 0) {
            res.status(404).send('Grupo no encontrado');
            await transaction.rollback();
            return;
        }

        const resultado = query_gru.dataValues;

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
});

app.listen(api_config.port, () => {
    console.log(`Api listening on port ${api_config.port}`)
  });