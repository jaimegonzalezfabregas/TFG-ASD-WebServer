const { Op } = require("sequelize");
const bcrypt = require('bcrypt');

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

async function authenticateUser(req, res, db) {
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
                res.status(422).send("Datos inválidos al hacer login");
                await transaction.rollback();
                return;
            }
        }
        else {
            res.status(422).send("Datos inválidos al hacer login");
            await transaction.rollback();
            return;
        }

        await transaction.commit();

        let resultado = {id: query.dataValues.id, nombre: query.dataValues.nombre, apellidos: query.dataValues.apellidos, email: query.dataValues.email, rol: query.dataValues.rol};
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(resultado);

    }
    catch (error) {
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }
}

async function createUser(req, res, db) {
    const transaction = await db.sequelize.transaction();

    try {
        if (req.body.creador == null) {
            res.status(422).send('Datos no válidos');
            await transaction.rollback();
            return;
        }

        const entidad_creador = await db.sequelize.models.Docente.findOne({
            where: {
                id: req.body.creador
            }
        });

        if (!entidad_creador) {
            res.status(404).send('Creador no encontrado');
            await transaction.rollback();
            return;
        }
        else if (entidad_creador.rol != 'Admin' && entidad_creador.rol != 'Decanato') {
            res.status(422).send('Datos no válidos');
            await transaction.rollback();
            return;
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
            console.log(`El docente con el email ${req.body.email} ya existe en la base de datos`);
            res.status(409).send(`El docente con el email ${req.body.email} ya existe en la base de datos`);
        }

        res.status(201).send('Usuario creado con éxito');
        transaction.commit();
        return;
    }
    catch (error) {
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }
}

async function getUsuarios(req, res, db) {
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
        console.log('Error while interacting with database:', error);
        res.status(500).send('Something went wrong');
        await transaction.rollback();
        return;
    }

    transaction.commit();
}

async function getUsuarioById(req, res, db) {
    let idUsuario;

    try {
        idUsuario = Number(req.params.idUsuario);
    }
    catch (error) {
        res.status(400).send('Id suministrado no válido');
        return;
    }

    const transaction = await db.sequelize.transaction();
        
    try {
        console.log('Searching in Docentes for id, nombre, apellidos, email');
        const query_doc = await db.sequelize.models.Docente.findOne({
            attributes:['id', 'nombre', 'apellidos', 'email', 'rol'],
            where: {
                id: idUsuario
            }
        });

        if (Object.keys(query_doc.dataValues).length == 0) {
            res.status(404).send('Usuario no encontrado');
            await transaction.rollback();
            return;
        }

        const resultado = query_doc.dataValues;

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
    authenticateUser, createUser, getUsuarios, getUsuarioById
}