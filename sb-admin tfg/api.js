const express = require('express');
const path = require('path');
const { Sequelize, DataTypes, Or } = require ('sequelize');
const moment = require('moment');
const { authenticator, totp } = require('otplib');
const { Dispositivo, Espacio, Docente, Asistencia } = require('./models');
const app = express();
const hostName = 'localhost';
const port = 8070;
const db_name = 'database';
const db_user = 'root';
const db_pass = '';

// Rutas de la API
const api_path = '/api/v1';

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

    const sequelize = new Sequelize(db_name, db_user, db_pass, {dialect: 'mysql', host: 'localhost', port: 7052});

    try {
        await sequelize.authenticate();
        console.log('Connection successful.');
    }
    catch (error) {
        console.error('Unable to connect:', error);
        res.status(500).send('Something went wrong');
        await sequelize.close();
        return;
    }

    const espacio = Espacio.model(sequelize, DataTypes);

    await espacio.sync();

    const transaction = await sequelize.transaction();
    
    try {
        console.log('Searching in Espacio for id, numero, tipo, edificio');
        const query = await espacio.findAll({
            attributes:['id', 'tipo', 'numero', 'edificio']
        });

        let espacios = [];
        query.forEach((esp) => {
            const values = esp.dataValues;
            espacios.push({ id: values.id, nombre: `${values.tipo} ${values.numero}` });
        });

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(espacios);
    }
    catch (error) {
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        await sequelize.close();
        return;
    }

    await transaction.commit();
    await sequelize.close();
});

// /espacios/{idEspacio} (Poner variable aquí??)
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

    const sequelize = new Sequelize(db_name, db_user, db_pass, {dialect: 'mysql', host: 'localhost', port: 7052});

    try {
        await sequelize.authenticate();
        console.log('Connection successful.');
    }
    catch (error) {
        console.error('Unable to connect:', error);
        res.status(500).send('Something went wrong');
        await sequelize.close();
        return;
    }

    const espacio = Espacio.model(sequelize, DataTypes);

    await espacio.sync();

    const transaction = await sequelize.transaction();
    
    try {
        console.log('Searching in Espacio for id, creadoPor, actualizadoPor, creadoEn, actualizadoEn, numero, tipo, edificio');
        const query = await espacio.findOne({
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
            nombre: `${query.tipo} ${query.numero}`
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(respuesta);
    
    }
    catch (error) {
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        await sequelize.close();
        return;
    }

    await transaction.commit();
    await sequelize.close();

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

    const sequelize = new Sequelize(db_name, db_user, db_pass, {dialect: 'mysql', host: 'localhost', port: 7052});

    try {
        await sequelize.authenticate();
        console.log('Connection successful.');
    }
    catch (error) {
        console.error('Unable to connect:', error);
        res.status(500).send('Something went wrong');
        await sequelize.close();
        return;
    }

    const dispositivo = Dispositivo.model(sequelize, DataTypes);

    await dispositivo.sync();

    const transaction = await sequelize.transaction();
    
    try {
        console.log('Searching in Dispositivo for id, nombre, espacioId, idExternoDispositivo');
        const query = await dispositivo.findAll({
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
        await sequelize.close();
        return;
    }

    await transaction.commit();
    await sequelize.close();
    
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
        
        const sequelize = new Sequelize(db_name, db_user, db_pass, { dialect:'mysql', host: 'localhost', port: 7052 });

        try {
            await sequelize.authenticate();
            console.log('Connection successful.');
        }
        catch (error) {
            console.error('Unable to connect:', error);
            res.status(500).send('Something went wrong');
            await sequelize.close();
            return;
        }

        const dispositivo = Dispositivo.model(sequelize, DataTypes);
        
        await dispositivo.sync();
        
        const transaction = await sequelize.transaction();

        try {   
            const dispSecret = authenticator.generateSecret();
            const disp = await dispositivo.create({ nombre: req.body.nombre, espacioId: req.body.espacioId, 
                idExternoDispositivo: req.body.idExternoDispositivo, creadoPor: 1, actualizadoPor: 1, 
                endpointSeguimiento: ('http://' + hostName + api_path) , t0: 0, secret: dispSecret }); // Preguntar por creadoPor, actualizadoPor y t0 (calcular tiempo o siempre 0)

            const respuesta = {
                id: disp.id,
                nombre: req.body.nombre,
                espacioId: req.body.espacioId,
                idExternoDispositivo: req.body.idExternoDispositivo,
                creadoPor: dispositivo.creadoPor,
                actualizadoPor: dispositivo.actualizadoPor,
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
            await sequelize.close();
            return;
        }

        await transaction.commit();
        await sequelize.close();
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

    const sequelize = new Sequelize(db_name, db_user, db_pass, {dialect: 'mysql', host: 'localhost', port: 7052});

    try {
        await sequelize.authenticate();
        console.log('Connection successful.');
    }
    catch (error) {
        console.error('Unable to connect:', error);
        res.status(500).send('Something went wrong');
        await sequelize.close();
        return;
    }

    const dispositivo = Dispositivo.model(sequelize, DataTypes);

    await dispositivo.sync();
        
    const transaction = await sequelize.transaction();
        
    try {
        console.log('Searching in Dispositivo for all columns');
        const query = await dispositivo.findOne({
            attributes: { exclude: [] },
            where: {
                espacioId: req.params.idDispositivo
            }
        });

        if (Object.keys(query.dataValues).length == 0) {
            res.status(404).send('Dispositivo no encontrado');
            await transaction.rollback();
            await sequelize.close();
            return;
        }
            
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(query.dataValues);
    }
    catch (error) {
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        await sequelize.close();
        return;
    }                                                                                                                                                                   
        
    await transaction.commit();
    await sequelize.close();
    
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
    
    const sequelize = new Sequelize(db_name, db_user, db_pass, {dialect: 'mysql', host: 'localhost', port: 7052});
        
    try {
        await sequelize.authenticate();
        console.log('Connection successful.');
    }
    catch (error) {
        console.error('Unable to connect:', error);
        res.status(500).send('Something went wrong');
        await sequelize.close();
        return;
    }
        
    const dispositivo = Dispositivo.model(sequelize, DataTypes);
              
    await dispositivo.sync();

    const transaction = await sequelize.transaction();

    try {
        console.log('Searching in Dispositivo for id');
        const query = await dispositivo.findOne({
            attributes: ['id'],
             where: {
                    espacioId: req.params.idDispositivo
        }
        });
                    
        if (Object.keys(query.dataValues).length == 0) {
            res.status(404).send('Dispositivo no encontrado');
            await transaction.rollback();
            await sequelize.close();
            return;
        }
            
        await dispositivo.destroy({
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
        await sequelize.close();
        return;
    }

    await transaction.commit();
    await sequelize.close();

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
                    
                    const sequelize = new Sequelize(db_name, db_user, db_pass, {dialect: 'mysql', host: 'localhost', port: 7052});
                    
                    try {
                        await sequelize.authenticate();
                        console.log('Connection successful.');
                    }
                    catch (error) {
                        console.error('Unable to connect:', error);
                        res.status(500).send('Something went wrong');
                        await sequelize.close();
                        return;
                    }
                    
                    const dispositivo = Dispositivo.model(sequelize, DataTypes);
                    const docente = Docente.model(sequelize, DataTypes);
                        
                    await dispositivo.sync();
                    await docente.sync();

                    const transaction = await sequelize.transaction();

                    try {
                        console.log('Searching in Dispositivo for id');
                        const query_disp = await dispositivo.findOne({ // Si hay más de un dispositivo habría que comprobar todos
                            attributes: ['id', 'secret'],
                            where: {
                                espacioId: req.body.espacioId
                            }
                        });
                                
                        if (Object.keys(query_disp.dataValues).length == 0) {
                            res.status(404).send('Dispositivo no encontrado');
                            await transaction.rollback();
                            await sequelize.close();
                            return;
                        }

                        console.log('Searching in Docente for id');
                        const query_user = await docente.findOne({
                            attributes: ['id'],
                            where: {
                                id: req.body.usuarioId
                            }
                        })
                        
                        if (Object.keys(query_user.dataValues).length == 0) {
                            res.send(404, 'Usuario no encontrado');
                            await transaction.rollback();
                            await sequelize.close();
                            return;
                        }
                        
                        // Preguntar por window (totp.options = { window: 0 })
                        totp.options = { epoch: req.body.totp.time, digits: 8, step: 30 };
                        const token = totp.generate(query_disp.dataValues.secret);
                        console.log(token, req.body.totp.value);
                        if (!authenticator.check(req.body.totp.value, query_disp.dataValues.secret)) {
                            res.status(422).send('Datos no válidos');
                            await transaction.rollback();
                            await sequelize.close();
                            return;
                        }

                        const asistencia = Asistencia.model(sequelize, DataTypes);

                        await asistencia.sync();

                        await asistencia.create({ docente_id: req.body.usuarioId, espacio_id: req.body.espacioId, fecha: moment.now(), estado: "Asistida"});

                        await transaction.commit();
                        await sequelize.close();
                    }
                    catch (error) {
                        console.log('Error while interacting with database:', error);
                        res.status(500).send('Something went wrong');
                        await transaction.rollback();
                        await sequelize.close();
                        return;
                    }
                    
                    await transaction.commit();
                    await sequelize.close();
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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  });