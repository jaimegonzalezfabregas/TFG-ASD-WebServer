const express = require('express');
const path = require('path');
const { Op } = require ('sequelize');
const moment = require('moment');
const { authenticator, totp } = require('otplib');
const db = require('./models');
const app = express();
const hostName = 'localhost';
const port = 8070;
// Rutas de la API
const api_path = '/api/v1';

app.use(express.json());
db.db.initDb();

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
    console.log(db.db);
    const transaction = await db.db.sequelize.transaction();
    
    try {
        console.log('Searching in Espacio for id, numero, tipo, edificio');
        const query = await db.db.sequelize.models.Espacio.findAll({
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

    const transaction = await db.db.sequelize.transaction();
    
    try {
        console.log('Searching in Espacio for id, creadoPor, actualizadoPor, creadoEn, actualizadoEn, numero, tipo, edificio');
        const query = await db.db.sequelize.models.Espacio.findOne({
            attributes:['id', 'creadoPor', 'actualizadoPor', 'creadoEn', 'actualizadoEn', 'edificio', 'tipo', 'numero', 'edificio'],
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

    const transaction = await db.db.sequelize.transaction();
    
    try {
        console.log('Searching in Dispositivo for id, nombre, espacioId, idExternoDispositivo');
        const query = await db.db.sequelize.models.Dispositivo.findAll({
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
   
    if (req.body != null && Object.keys(req.body).length == 3 && req.body.nombre != null && req.body.espacioId != null && req.body.idExternoDispositivo != null) {

        if (!Number.isInteger(req.body.espacioId) || typeof req.body.nombre != 'string' || typeof req.body.idExternoDispositivo != 'string') {
            res.status(422).send('Datos no válidos');
            return;
        }
        
        const transaction = await db.db.sequelize.transaction();

        try {   
            const dispSecret = authenticator.generateSecret();
            const disp = await db.db.sequelize.models.Dispositivo.create({ nombre: req.body.nombre, espacioId: req.body.espacioId, 
                idExternoDispositivo: req.body.idExternoDispositivo, creadoPor: 1, actualizadoPor: 1, 
                endpointSeguimiento: ('http://' + hostName + api_path) , t0: 0, secret: dispSecret }); // Preguntar por creadoPor, actualizadoPor y t0 (calcular tiempo o siempre 0)

            const respuesta = {
                id: disp.id,
                nombre: req.body.nombre,
                espacioId: req.body.espacioId,
                idExternoDispositivo: req.body.idExternoDispositivo,
                creadoPor: db.db.sequelize.models.Dispositivo.creadoPor,
                actualizadoPor: db.db.sequelize.models.Dispositivo.actualizadoPor,
                endpointSeguimiento: ('http://' + hostName + api_path),
                totpConfig: {
                    t0: 0,
                    secret: dispSecret
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
        
    const transaction = await db.db.sequelize.transaction();
        
    try {
        console.log('Searching in Dispositivo for all columns');
        const query = await db.db.sequelize.models.Dispositivo.findOne({
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

    const transaction = await db.db.sequelize.transaction();

    try {
        console.log('Searching in Dispositivo for id');
        const query = await db.db.sequelize.models.Dispositivo.findOne({
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
            
        await db.db.sequelize.models.Dispositivo.destroy({
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

    if (Object.keys(req.body).length != 0 && req.body.tipo_registro != null && req.body.espacioId != null && Number.isInteger(req.body.espacioId)) {

        switch (req.body.tipo_registro) {
            case "RegistroSeguimientoUsuario":
                if (req.body.usuarioId != null && Number.isInteger(req.body.usuarioId)) {

                    const transaction = await db.db.sequelize.transaction();

                    try {
                        console.log('Searching in Dispositivo for id');
                        const query_disp = await db.db.sequelize.models.Dispositivo.findOne({ // Si hay más de un dispositivo habría que comprobar todos
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
                        const query_user = await db.db.sequelize.models.Docente.findOne({
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
                        totp.options = { epoch: req.body.totp.time, digits: 8, step: 30, window: [1, 0] };
                        if (!totp.verify({token: req.body.totp.value.toString(), secret: query_disp.dataValues.secret})) {
                            res.status(422).send('Datos no válidos');
                            await transaction.rollback();
                            return;
                        }

                        await db.db.sequelize.models.Asistencia.create({ docente_id: req.body.usuarioId, espacio_id: req.body.espacioId, fecha: moment.now(), estado: "Asistida"});

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
});

// /ble
app.get(api_path + '/ble', (req, res) => {
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
        security:
            - ApiKeyAuth: []
    */
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

    const transaction = await db.db.sequelize.transaction();
    
    try {
        console.log('Searching in Docente for id, email, password, nombre, apellidos');

        const query = await db.db.sequelize.models.Docente.findOne({
            attributes: ['id', 'email', 'password', 'nombre', 'apellidos', 'rol'],
            where: {
            email: req.body.email
            }
        });
        
        if (query == null || query.dataValues.password != req.body.password) {
            throw error("Datos inválidos al hacer login");
        }

        await transaction.commit();

        let resultado = JSON.stringify({id: query.dataValues.id, nombre: query.dataValues.nombre, email: query.dataValues.email, rol: query.dataValues.rol});
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

// /usuarios/{idUsuario}
app.post(api_path + '/usuarios/:idUsuario', async (req, res) => {
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
    
    const transaction = await db.db.sequelize.transaction();
    
    try {
        console.log('Searching in Docente for id');
        const query_doc = await db.db.sequelize.models.Docente.findOne({
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
        
        const currentHour = "16:30"; //moment().format('HH:MM'); //Cambiar la hora para probar aquí

        switch (req.body.opcion) {
            case "espacios_rutina":

                console.log('Searching in Actividad impartida por Docente for actividad_id');
                const query_r = await db.db.sequelize.models.Actividad.findAll({
                    attributes: ['id'], 
                    include: {
                        model: db.db.sequelize.models.Docente,
                        as: 'impartida_por',
                        where: {
                            id: req.params.idUsuario 
                        }
                    },
                });
                
                //Si tiene actividades
                if (query_r.length != 0) {

                    console.log(query_r);

                    query_r.forEach((act) => {
                        actividades_ids.push(act.dataValues.id);
                    });

                    console.log('Searching in Actividad for id, tiempo_inicio, tiempo_fin');
                    
                    //Comprobamos que estén en la franja horaria actual
                    const query_act_r = await db.db.sequelize.models.Actividad.findAll({
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
                        const query_esp_r = await db.db.sequelize.models.Espacio.findAll({
                            attributes:['id'],
                            include: {
                                model: db.db.sequelize.models.Actividad,
                                association: 'ocupado_por',
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
                const query_i = await db.db.sequelize.models.Actividad.findAll({
                    attributes: ['id'], 
                    include: {
                        model: db.db.sequelize.models.Docente,
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
                    const query_act_i = await db.db.sequelize.models.Actividad.findAll({
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
                        const query_esp_i = await db.db.sequelize.models.Espacio.findAll({
                            attributes:['id'],
                            include: {
                                model: db.db.sequelize.models.Actividad,
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

                        let query_neg_i = await db.db.sequelize.models.Espacio.findAll({
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


app.listen(port, () => {
    console.log(`Api listening on port ${port}`)
  });