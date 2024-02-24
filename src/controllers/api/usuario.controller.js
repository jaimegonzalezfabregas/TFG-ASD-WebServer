const { Op } = require("sequelize");
const bcrypt = require('bcrypt');

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
}

module.exports = {
    authenticateUser
}