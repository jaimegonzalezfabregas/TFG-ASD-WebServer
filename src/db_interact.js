const { Sequelize, DataTypes } = require('sequelize');

async function docente(sequelize) {
    
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

    await sequelize.transaction( async() => {
        const heliodoro = await Docente.create({nombre: 'Heliodoro', apellidos: 'de la Rosa del Palacio', email: 'heliropa@fdi.ucm.es', password: 'SonoChiNoSadame'})
        const cristobal = await Docente.create({nombre: 'Cristóbal', apellidos: 'Sánchez Pereira', email: 'crissp@fdi.ucm.es', password: 'asdf'})

        await heliodoro.save();
        await cristobal.save();
    });

    await Docente.sync();

}

async function actividad(sequelize) {

    const Actividad = sequelize.define('Actividad', {
        clases: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        docente: {
            type: DataTypes.STRING,
            allowNull: false
        },
        espacios: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey:true
            
        },
        fecha_hora: {
            type: DataTypes.DATE,
            allowNull: false,
            primaryKey:true
        }
    }, {
        freezeTableName: true
    });

    await Actividad.sync({ force:true });
}

async function espacio(sequelize) {

    const Espacio = sequelize.define('Espacio', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        tipo: {
            type: DataTypes.ENUM('Aula', 'Laboratorio'),
            allowNull: false,
            primaryKey: true
        },
        edificio: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey:true
        }
    }, {
        freezeTableName: true
    });

    await Espacio.sync({ force:true });

    Espacio.create({ id: 3, tipo: 'Aula', edificio: 'FdI' });
}

async function asignatura(sequelize) {

    const Asignatura = sequelize.define('Asignatura', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        siglas: {
            type: DataTypes.STRING,
            allowNull: false
        },
        plan: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        freezeTableName: true
    });

    await Asignatura.sync({ force:true });

    Asignatura.create({id: 837483, siglas: "TP2", nombre: "Tecnología de la Programación II", plan: 'GII'});

}

async function grupo(sequelize) {

    const Grupo = sequelize.define('Grupo', {
        curso: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        letra: {
            type: DataTypes.STRING(1),
            allowNull: false,
            primaryKey: true
        },
        grado: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        }
    }, {
        freezeTableName: true
    });

    await Grupo.sync({ force:true });

    Grupo.create({curso: 2, letra: 'B', grado: 'GII'});
    Grupo.create({curso: 2, letra: 'A', grado: 'GII'});
    Grupo.create({curso: 2, letra: 'B', grado: 'GIS'});
    Grupo.create({curso: 2, letra: 'B', grado: 'GDV'});

}


async function relations() {


    const sequelize = new Sequelize('database', 'root', 'FE3Hadrestia', {dialect: 'mysql', host: 'localhost'});
    try {
        await sequelize.authenticate();
        console.log('Connection successful.');
    }
    catch (error) {
        console.error('Unable to connect:', error);
    }
    
    docente(sequelize);
    actividad(sequelize);
    espacio(sequelize);
    asignatura(sequelize);
    grupo(sequelize);

    const Docente = sequelize.models.Docente;
    const Actividad = sequelize.models.Actividad;
    const Espacio = sequelize.models.Espacio;
    const Asignatura = sequelize.models.Asignatura;
    const Grupo = sequelize.models.Grupo;

    await sequelize.sync();
    

    Docente.belongsToMany(Actividad, { through: 'Actividad_Docente'});
    Actividad.belongsToMany(Docente, { through: 'Actividad_Docente'});

    Espacio.belongsToMany(Actividad, { through: 'Actividad_Espacio'});
    Actividad.belongsToMany(Espacio, { through: 'Actividad_Espacio'});

    const Clase = sequelize.define('Clase', {});

    await Clase.sync({force: true});

    Asignatura.belongsToMany(Grupo, { through: Clase });
    Grupo.belongsToMany(Asignatura, { through: Clase });

    Actividad.belongsToMany(Clase, { through: 'Actividad_Clase'});
    Clase.belongsToMany(Actividad, { through: 'Actividad_Clase'});

    await sequelize.sync();

    //Clase.create({AsignaturaId: 837483, GrupoCurso: 2});

    let query1 = await Grupo.findAll({
    });

    for (i in query1) {
        console.log(query1[i].dataValues);
    }

    let query2 = await Asignatura.findAll({
    });

    for (i in query2) {
        console.log(query2[i].dataValues);
    }

    // let query3 = await Clase.findAll({
    // });

    // for (i in query3) {
    //     console.log(query3[i].dataValues);
    // }

    let query4 = await Docente.findAll({
    });

    for (i in query4) {
        console.log(query4[i].dataValues);
    }

    await sequelize.close();
}

relations();