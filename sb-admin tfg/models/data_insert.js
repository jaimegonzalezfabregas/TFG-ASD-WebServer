const path = require('path')
const sqlite = require('sqlite3')
const { Sequelize, DataTypes, Model } = require("sequelize")
const moment = require('moment');
const { Docente, Actividad, Espacio, Asignatura, Grupo, Excepcion, Recurrencia, Plan, Titulacion, Relaciones } = require ('../models');
const { isAsyncFunction } = require('util/types');

//db_name: string with the filename and extension of the database (example: 'database.db')
function create_db(db_name)  {
    let db = new sqlite.Database(path.join(__dirname, '/' +  db_name), sqlite.OPEN_CREATE | sqlite.OPEN_READWRITE, (err) => {
        if (err) {
            console.log('Unable to create database ', db_name);
        }
        else {
            console.log('Database %s created correctly', db_name)
        }
    })

    db.close();
    
}

//db_name: string with the filename and extension of the database (example: 'database.db')
async function db_insert(db_name) {

    const sequelize = new Sequelize({ dialect: 'sqlite', storage: db_name });
    try {
        await sequelize.authenticate();
        console.log('Connection established.');
    } catch (error) {
        console.log('Unable to connect: ', error);
        return;
    }

    const docente = Docente.model(sequelize, DataTypes);
    const actividad = Actividad.model(sequelize, DataTypes);
    const espacio = Espacio.model(sequelize, DataTypes);
    const asignatura = Asignatura.model(sequelize, DataTypes);
    const grupo = Grupo.model(sequelize, DataTypes);
    const plan = Plan.model(sequelize, DataTypes);
    const titulacion = Titulacion.model(sequelize, DataTypes);
    const recurrencia = Recurrencia.model(sequelize, DataTypes);
    const excepcion = Excepcion.model(sequelize, DataTypes);

    const clase = sequelize.define('Clase', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoincrement: true
        }
    }, { freezeTableName: true }); //Tabla de la agrupación asignatura y grupo

    const join_actividad_espacio = sequelize.define('Join_Actividad_Espacio', {}, { freezeTableName: true }); //Tabla de la relación en (Actividad en Espacio)
    const join_actividad_docentes = sequelize.define('Join_Actividad_Docentes', {}, { freezeTableName: true }); //Tabla de la relación imparte (Docente imparte Actividad)
    const join_actividad_clase = sequelize.define('Join_Actividad_Clase', {}, { freezeTableName: true }); //Tabla de la relación asiste (Clase asiste Actividad)

    //Deletes y Creates en un orden para no encontrarse con errores de foreign keys
    await join_actividad_clase.sync({force: true});
    await join_actividad_espacio.sync({force: true});
    await join_actividad_docentes.sync({force: true});
    await excepcion.sync({force: true});
    await recurrencia.sync({force: true});
    await espacio.sync({force: true});
    await clase.sync({force: true});
    await grupo.sync({force: true});
    await asignatura.sync({force: true});
    await plan.sync({force: true});
    await titulacion.sync({force: true});
    await actividad.sync({force: true});
    await docente.sync({force: true});

    await Relaciones.relate(sequelize);

    await sequelize.sync({ force: true });
    

    const transaction = await sequelize.transaction();
    
    try {
        await docente.create({nombre: 'Marta', apellidos: 'Estévez García', email: 'maestga@fdi.ucm.es', password: 'asdf', rol: 'Admin'});
        await docente.create({nombre: 'Alejandro', apellidos: 'Ortiz Perseida', email: 'alejop@fdi.ucm.es', password: 'fdsa', rol: 'Decanato'});
        await docente.create({nombre: 'Marcelo', apellidos: 'Adilo Orense', email: 'marcador@fdi.ucm.es', password: 'sdfg', rol: 'Usuario'});

        // try {
        //     await docente.create({nombre: 'Mari Carmen', apellidos: 'Díaz Oregui', email: 'marcador@fdi.ucm.es', password: 'asdf', rol: 'Usuario'});
        // } catch (error) {
        //     console.log('Unique constraint works: ', error);
        // }

        await titulacion.create({id: 'Grado en Ingeniería Informática'});

        await plan.create({id: '2019', titulacion_id: 'Grado en Ingeniería Informática'});

        await asignatura.create({id: 802239, nombre: 'Programación Declarativa', siglas: 'PD', periodo: 1, plan_id: '2019'});

        await grupo.create({curso: 3, letra: 'A'});

        await espacio.create({numero: 1, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 2, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 3, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 4, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 5, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 6, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 7, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 8, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 9, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 10, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 11, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 12, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 13, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 14, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 15, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 16, tipo: 'Aula', edificio: 'FdI'});
        await espacio.create({numero: 1, tipo: 'Laboratorio', edificio: 'FdI'});
        await espacio.create({numero: 2, tipo: 'Laboratorio', edificio: 'FdI'});
        await espacio.create({numero: 3, tipo: 'Laboratorio', edificio: 'FdI'});
        await espacio.create({numero: 4, tipo: 'Laboratorio', edificio: 'FdI'});
        await espacio.create({numero: 5, tipo: 'Laboratorio', edificio: 'FdI'});
        await espacio.create({numero: 6, tipo: 'Laboratorio', edificio: 'FdI'});
        await espacio.create({numero: 7, tipo: 'Laboratorio', edificio: 'FdI'});
        await espacio.create({numero: 8, tipo: 'Laboratorio', edificio: 'FdI'});
        await espacio.create({numero: 9, tipo: 'Laboratorio', edificio: 'FdI'});
        await espacio.create({numero: 10, tipo: 'Laboratorio', edificio: 'FdI'});
        await espacio.create({numero: 11, tipo: 'Laboratorio', edificio: 'FdI'});
        await espacio.create({numero: 1008, tipo: 'Aula', edificio: 'Multiusos'});
        await espacio.create({numero: 1208, tipo: 'Aula', edificio: 'Multiusos'});
        await espacio.create({numero: 1210, tipo: 'Aula', edificio: 'Multiusos'});
        await espacio.create({numero: 1218, tipo: 'Aula', edificio: 'Multiusos'});
        await espacio.create({numero: 1220, tipo: 'Aula', edificio: 'Multiusos'});

        await actividad.create({fecha_inicio: moment.now(), tiempo_inicio: '16:00', tiempo_fin: '17:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creado_por: 'Galdo', responsable_id: 3});

        await clase.create({ asignatura_id: 802239, grupo_id: 1});
        await join_actividad_docentes.create({ docente_id: 3, actividad_id: 1 });
        await join_actividad_clase.create({ actividad_id: 1, clase_id: 1});
        await join_actividad_espacio.create({ actividad_id: 1, espacio_id: 4 });
        await join_actividad_espacio.create({ actividad_id: 1, espacio_id: 5 });

    } catch (error) {
        console.log('Error on transaction: ', error);
    }

    await transaction.commit();

    await sequelize.close();
}

create_db('tfg_db.db');
db_insert('tfg_db.db');