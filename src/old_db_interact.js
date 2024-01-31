const sqlite = require('sqlite3').verbose();
const { Sequelize , DataTypes } = require('sequelize')

// MIRAR UUIDS PARA SEMILLAS DE QR

async function act() {
    const db = new sqlite.Database('database.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Database created.");
        }
    })

    const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'database.db'});

    try {
        await sequelize.authenticate();
        console.log('Connection successful.');
    }
    catch (error) {
        console.error('Unable to connect:', error);
    }

    const Docente = sequelize.define('Docente', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        apellidos: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        freezeTableName: true
    });

    await Docente.sync({ force:true });

    const heliodoro = await Docente.create({nombre: 'Heliodoro', apellidos: 'de la Rosa del Palacio', email: 'heliropa@fdi.ucm.es', password: 'SonoChiNoSadame'})
    const cristobal = await Docente.create({nombre: 'Cristóbal', apellidos: 'Sánchez Pereira', email: 'crissp@fdi.ucm.es', password: 'asdf'})

    heliodoro.save();
    cristobal.save();
    
    try {
        let query = await Docente.findAll({
            attributes: ['id', 'apellidos', 'nombre']
        })
        for (let index in query) { 
            console.log('Query results:', query[index].dataValues);
        }
    } catch (err) {
        console.log('Unable to query:', err);
    }

}

act();