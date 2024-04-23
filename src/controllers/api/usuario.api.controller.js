const logger = require('../../config/logger.config').child({"process": "api"});

const bcrypt = require('bcrypt');
const { where } = require('sequelize');

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

async function authenticateUser(req, res, next, db) {
    const transaction = await db.sequelize.transaction();
    
    try {
        logger.info('Searching in Docente for id, email, password, nombre, apellidos');

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
                await transaction.rollback();
                let err = {};
                err.status = 422;
                err.message = 'Datos no válidos';
                return next(err);
            }
        }
        else {
            await transaction.rollback();
            let err = {};
            err.status = 422;
            err.message = 'Datos no válidos';
            return next(err);
        }

        await transaction.commit();

        let resultado = {id: query.dataValues.id, nombre: query.dataValues.nombre, apellidos: query.dataValues.apellidos, email: query.dataValues.email, rol: query.dataValues.rol};
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(resultado);

    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        await transaction.rollback();
        let err = {};
        err.status = 500;
        err.message = 'Something went wrong';
        return next(err);
    }
}

async function createUser(req, res, next, db) {
    if (req.body.creador == null) {
        let err = {};
        err.status = 422;
        err.message = 'Datos no válidos';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();

    try {
        const entidad_creador = await db.sequelize.models.Docente.findOne({
            where: {
                id: req.body.creador
            }
        });

        if (!entidad_creador) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Creador no encontrado';
            return next(err);
        }
        else if (entidad_creador.rol != 'Admin' && entidad_creador.rol != 'Decanato') {
            await transaction.rollback();
            let err = {};
            err.status = 422;
            err.message = 'Datos no válidos';
            return next(err);
        }

        //Contraseña con pimienta y sal autogenerada, codificada con bcrypt
        let spicedPassword = await bcrypt.hash(spices[Math.random() % spices.length] + req.body.password, 4);

        const [usuario, nuevo] = await db.sequelize.models.Docente.findOrCreate({
            where: {
                email: req.body.email
            },
            defaults: {
                nombre: req.body.nombre,
                apellidos: req.body.apellidos,
                email: req.body.email,
                password: spicedPassword,
                rol: req.body.rol || 'Usuario'
            }
        });

        if (!nuevo) {
            await transaction.rollback();
            logger.error(`El docente con el email ${req.body.email} ya existe en la base de datos`);
            let err = {}
            err.status = 409;
            err.message = `El docente con el email ${req.body.email} ya existe en la base de datos`;
            return next(err);
        }

        res.status(201).send('Usuario creado con éxito');
        transaction.commit();
        return;
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        await transaction.rollback();
        let err = {};
        err.status = 500;
        err.message = 'Something went wrong';
        return next(err);
    }
}

async function getUsuarios(req, res, next, db) {
    const transaction = await db.sequelize.transaction();

    try {
        const query_usuarios = await db.sequelize.models.Docente.findAll({
            attributes: ['id']
        });

        let resultado = [];
        query_usuarios.forEach(user => {
            resultado.push(user.dataValues);
        });

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(resultado);
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        await transaction.rollback();
        let err = {};
        err.status = 500;
        err.message = 'Something went wrong';
        return next(err);
    }

    transaction.commit();
}

async function getUsuarioById(req, res, next, db) {
    let idUsuario = Number(req.params.idUsuario);
    if (!Number.isInteger(idUsuario)) {
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        logger.info('Searching in Docentes for id, nombre, apellidos, email');
        const query_doc = await db.sequelize.models.Docente.findOne({
            attributes:['id', 'nombre', 'apellidos', 'email', 'rol'],
            where: {
                id: idUsuario
            }
        });

        if (query_doc == null || Object.keys(query_doc.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Usuario no encontrado';
            return next(err);
        }

        const resultado = query_doc.dataValues;

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(resultado);
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

async function registerMACToUsuario(req, res, next, db) {
    let idUsuario = Number(req.params.idUsuario);
    if (!Number.isInteger(idUsuario)) {           
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    if (req.body.mac == null || !/^([0-9A-F]{2}[:]){5}([0-9A-F]){2}$/.test(req.body.mac)) {
        let err = {};
        err.status = 422;
        err.message = 'Datos no válidos';
        return next(err);
    }

    const transaction = await db.sequelize.transaction();

    try {
        logger.info('Searching in Docente for id');
        const query_doc = await db.sequelize.models.Docente.findOne({
            attributes:['id'],
            where: {
                id: idUsuario
            }
        });

        // Comprobamos que el usuario exista en la base de datos
        if (query_doc == null || Object.keys(query_doc.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Usuario no encontrado';
            return next(err);
        }
        
        const [query_mac, created] = await db.sequelize.models.Macs.findOrCreate({
            where: {
                mac: req.body.mac
            },
            defaults: {
                mac: req.body.mac,
                usuario_id: idUsuario
            }
        });

        if (!created) {
            await transaction.rollback();
            let err = {}
            err.status = 409
            err.message = 'MAC ya registrada';    
            return next(err);
        }
        
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send('MAC registrada con éxito');
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

async function registerNFCToUsuario(req, res, next, db) {
    let idUsuario = Number(req.params.idUsuario);
    if (!Number.isInteger(idUsuario)) {           
        let err = {};
        err.status = 400;
        err.message = 'Id suministrado no válido';
        return next(err);
    }

    let uid_nfc = -1;
    if (req.body.uid == null) {
        let err = {};
        err.status = 422;
        err.message = 'Datos no válidos';
        return next(err);
    }
    else {
        uid_nfc = Number(req.body.uid);
        if (!Number.isInteger(uid_nfc)) {
            let err = {};
            err.status = 422;
            err.message = 'Datos no válidos';
            return next(err);
        }
    }
    
    const transaction = await db.sequelize.transaction();

    try {
        logger.info('Searching in Docente for id');
        const query_doc = await db.sequelize.models.Docente.findOne({
            attributes:['id'],
            where: {
                id: idUsuario
            }
        });

        // Comprobamos que el usuario exista en la base de datos
        if (query_doc == null || Object.keys(query_doc.dataValues).length == 0) {
            await transaction.rollback();
            let err = {};
            err.status = 404;
            err.message = 'Usuario no encontrado';
            return next(err);
        }
        
        const [query_nfc, created] = await db.sequelize.models.Nfcs.findOrCreate({
            where: {
                nfc: uid_nfc
            },
            defaults: {
                nfc: uid_nfc,
                usuario_id: idUsuario
            }
        });

        if (!created) {
            await transaction.rollback();
            let err = {}
            err.status = 409
            err.message = 'UID de NFC ya registrado';
            return next(err);
        }
        
        res.status(200).send('UID de NFC registrado con éxito');
        
    }
    catch (error) {
        logger.error(`Error while interacting with database: ${error}`);
        await transaction.rollback();
        let err = {};
        err.status = 500;
        err.message = 'Something went wrong';
        return next(err);
    }
    
    transaction.commit();
}

module.exports = {
    authenticateUser, createUser, getUsuarios, getUsuarioById, registerMACToUsuario, registerNFCToUsuario
}