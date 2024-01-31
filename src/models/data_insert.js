const db = require('.');
const moment = require('moment');

async function db_insert() {

    const db_n = await db.db.initDb();

    const transaction = await db.db.sequelize.transaction();
    
    try {
        await db.db.sequelize.models.Docente.create({nombre: 'Marta', apellidos: 'Estévez García', email: 'maestga@fdi.ucm.es', password: 'asdf', rol: 'Admin'});
        await db.db.sequelize.models.Docente.create({nombre: 'Alejandro', apellidos: 'Ortiz Perseida', email: 'alejop@fdi.ucm.es', password: 'fdsa', rol: 'Decanato'});
        await db.db.sequelize.models.Docente.create({nombre: 'Marcelo', apellidos: 'Adilo Orense', email: 'marcador@fdi.ucm.es', password: 'sdfg', rol: 'Usuario'});

        // try {
        //     await docente.create({nombre: 'Mari Carmen', apellidos: 'Díaz Oregui', email: 'marcador@fdi.ucm.es', password: 'asdf', rol: 'Usuario'});
        // } catch (error) {
        //     console.log('Unique constraint works: ', error);
        // }

        await db.db.sequelize.models.Titulacion.create({id: 'Grado en Ingeniería Informática'});

        await db.db.sequelize.models.Plan.create({id: '2019', titulacion_id: 'Grado en Ingeniería Informática'});

        await db.db.sequelize.models.Asignatura.create({id: 802239, nombre: 'Programación Declarativa', siglas: 'PD', periodo: 1, plan_id: '2019'});
        await db.db.sequelize.models.Asignatura.create({id: 805315, nombre: 'Metodos Algoritmicos en Resolución de Problemas I', siglas: 'MAR1', periodo: 1, plan_id: '2019'});

        await db.db.sequelize.models.Grupo.create({curso: 3, letra: 'A'});

        await db.db.sequelize.models.Espacio.create({numero: 1, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 2, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 3, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 4, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 5, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 6, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 7, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 8, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 9, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 10, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 11, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 12, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 13, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 14, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 15, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 16, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 1, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 2, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 3, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 4, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 5, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 6, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 7, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 8, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 9, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 10, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 11, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 1008, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 1208, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 1210, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 1218, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1});
        await db.db.sequelize.models.Espacio.create({numero: 1220, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1});

        await db.db.sequelize.models.Actividad.create({fecha_inicio: moment.now(), tiempo_inicio: '16:00', tiempo_fin: '17:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creado_por: 'Galdo', responsable_id: 3});
        await db.db.sequelize.models.Actividad.create({fecha_inicio: moment.now(), tiempo_inicio: '18:00', tiempo_fin: '19:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creado_por: 'Galdo', responsable_id: 3});

        await db.db.sequelize.models.Clase.create({ asignatura_id: 802239, grupo_id: 1});
        await db.db.sequelize.models.Clase.create({ asignatura_id: 805315, grupo_id: 1});
        
        await db.db.sequelize.models.Join_Actividad_Docentes.create({ docente_id: 3, actividad_id: 1 });
        await db.db.sequelize.models.Join_Actividad_Docentes.create({ docente_id: 3, actividad_id: 2 });
        await db.db.sequelize.models.Join_Actividad_Clase.create({ actividad_id: 1, clase_id: 1});
        await db.db.sequelize.models.Join_Actividad_Clase.create({ actividad_id: 2, clase_id: 1});
        await db.db.sequelize.models.Join_Actividad_Espacio.create({ actividad_id: 1, espacio_id: 4 });
        await db.db.sequelize.models.Join_Actividad_Espacio.create({ actividad_id: 1, espacio_id: 5 });
        await db.db.sequelize.models.Join_Actividad_Espacio.create({ actividad_id: 2, espacio_id: 5 });

    } catch (error) {
        console.log('Error on transaction: ', error);
        await transaction.rollback();
        return;
    }

    await transaction.commit();
}

db_insert();