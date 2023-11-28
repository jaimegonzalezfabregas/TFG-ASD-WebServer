const sqlite = require('sqlite3');
const path = require('path');
const { Sequelize , DataTypes } = require('sequelize');

// MIRAR UUIDS PARA SEMILLAS DE QR

async function docente() {
    const db = new sqlite.Database(path.join(__dirname, '/database.db'), sqlite.OPEN_CREATE | sqlite.OPEN_READWRITE, (err) => {

    })
    
    db.close();

    const sequelize = new Sequelize({ dialect: 'sqlite', database: path.join(__dirname, '/database.db') })

    try {
        await sequelize.authenticate();
        console.log('Connection established.');
    } catch (error) {
        console.error('Conection not established:', error);
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

    await Docente.create({nombre: 'Cristóbal', apellidos: 'Sánchez Pereira', email: 'crissp@fdi.ucm.es', password: 'asdf'});
    await sequelize.transaction( async() => {
        await Docente.create({nombre: 'Heliodoro', apellidos: 'de la Rosa del Palacio', email: 'heliropa@fdi.ucm.es', password: 'SonoChiNoSadame'});
        
    });

    await Docente.sync();

    const query = await Docente.findAll();
    //console.log(query);
    for (i in query) {
        console.log(query[i].dataValues);
    }

    await sequelize.close();

    const sequelize2 = new Sequelize({ dialect: 'sqlite', database: path.join(__dirname, '/database.db') })

    try {
        await sequelize2.authenticate();
        console.log('Connection established.');
    } catch (error) {
        console.error('Conection not established:', error);
    }

    const Docente2 = sequelize2.define('Docente', {
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

    await Docente2.sync({});

    const query2 = await Docente2.findAll();
    console.log(query2);
    for (i in query2) {
        console.log(query2[i].dataValues);
    }

    await Docente2.sync();

    await sequelize2.close();
}

docente();