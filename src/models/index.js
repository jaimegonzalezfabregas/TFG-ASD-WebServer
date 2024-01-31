//Archivo para hacer un único require y tener siempre el mismo sequelize con las mismas asociaciones de modelos.

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');
const db_config = require('../config/db.config');

const db = {};

async function authSequelize(sequelize) {
    try {
        await sequelize.authenticate();
        console.log('Connection successful.');
        return true;
    }
    catch (error) {
        console.error('Unable to connect:', error);
        res.status(500).send('Something went wrong');
        await sequelize.close();
        return false;
    }
}

db.initDb = async function () {
    // Inicializamos la base de datos con los parámetros pertinentes
    const sequelize = new Sequelize(db_config.name, db_config.user, db_config.password, { dialect: db_config.dialect, host: db_config.host, port: db_config.port });

    try{
        if (authSequelize(sequelize)) {
            // Obtenemos todos los ficheros .js de la carpeta
            const files = fs.readdirSync(__dirname).filter((file) => 
                file.indexOf('.') != 0 && file != path.basename(__filename) && file.slice(-9) == '.model.js');

            await Promise.all(files.map(async file => {
                const _model = (require(path.join(__dirname, file))).model(sequelize, DataTypes);
                db[_model.name] = _model;
            }));

            // ).forEach(async (file) => {
            //     const model = require(path.join(__dirname, file));
            //     model.model(sequelize, DataTypes);
            //     db[model.name] = model;
            // });
            
            // Llamamos a la función associate de cada modelo si este la tiene
            Object.keys(db).forEach((modelName) => {
                // Si el componente tiene asociaciones, las ejecutamos
                console.log(modelName);
                console.log(db[modelName].associate);
                if (db[modelName].associate) {
                    console.log()
                    db[modelName].associate(db);
                }
            });
            
            // Añadimos a db la sesión de sequelize
            db.sequelize = sequelize;
            db.Sequelize = Sequelize;

            await sequelize.sync();
            return db;
        }
        else {
            console.log("Something went wrong");
            throw error;
        }
    }
    catch (error) {
        console.log(error);
    }
}

module.exports = { db }