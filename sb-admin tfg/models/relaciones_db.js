async function relate(sequelize) {

    const docente = sequelize.models.Docente;
    const actividad = sequelize.models.Actividad;
    const espacio = sequelize.models.Espacio;
    const asignatura = sequelize.models.Asignatura;
    const grupo = sequelize.models.Grupo;
    const plan = sequelize.models.Plan;
    const titulacion = sequelize.models.Titulacion;
    const recurrencia = sequelize.models.Recurrencia;
    const excepcion = sequelize.models.Excepcion;
    const clase = sequelize.models.Clase; //Tabla de la agrupación asignatura y grupo
    const asistencia = sequelize.models.Asistencia;
    
    await sequelize.sync({force: true});

    // TIPOS DE RELACIONES
    // One to One: 
    //      modelo1.hasOne(modelo2);
    //      modelo2.belongsTo(modelo1);
    //
    // One to Many:
    //      modelo1.hasMany(modelo2);
    //      modelo2.belongsTo(modelo1);
    //
    // Many to Many:
    //      modelo1.belongsToMany(modelo2);
    //      modelo2.belongsToMany(modelo1);
    //

    //Relaciones Docente
    docente.hasMany(actividad, { as: 'responsable' }); //Un docente es responsable de varias clases (responsable)
    docente.belongsToMany(actividad, { as: 'impartidor', through: 'Join_Actividad_Docentes', foreignKey: { name: 'docente_id', allowNull: false } }); //Un docente imparte varias clases (imparte)
    docente.belongsToMany(espacio, { through: asistencia, foreignKey: {name: 'docente_id', allowNull: false } }); //Un docente asiste a varios espacios para realizar actividades

    //Relaciones Actividad
    actividad.hasMany(actividad); //Una actividad puede tener varias como hijo (procede de)
    actividad.belongsTo(actividad, { foreignKey: { name: 'actividad_padre_id' } }); //Una actividad puede tener otra como padre (procede de)
    actividad.hasMany(recurrencia); //Una actividad puede seguir varios tipos de recurrencia (sigue)
    actividad.hasMany(excepcion); //Una actividad puede tener varias excepciones (altera)
    actividad.belongsToMany(docente, { as: 'impartidor', through: 'Join_Actividad_Docentes', foreignKey: { name: 'actividad_id', allowNull: false } }); //Una actividad tiene uno o más docentes asignados (imparte)
    actividad.belongsTo(docente, { as: 'responsable', foreignKey: { name: 'responsable_id', allowNull: false } }); //Una actividad tiene un docente responsable (responsable)
    actividad.belongsToMany(espacio, { through: 'Join_Actividad_Espacio', foreignKey: { name: 'actividad_id', allowNull: false } }); //Una actividad ocupa uno o más espacios (en)
    actividad.belongsToMany(clase, { through: 'Join_Actividad_Clase', foreignKey: { name: 'actividad_id', allowNull: false } }); //Una actividad puede ser de una o más clases (asiste)
    
    //Relaciones Recurrencia
    recurrencia.belongsTo(actividad, { foreignKey: { name: 'actividad_id', allowNull: false } }); //Una recurrencia pertenece a una actividad

    //Relaciones Excepcion
    excepcion.belongsTo(actividad, { foreignKey: { name: 'actividad_id', allowNull: false } }); //Una excepcion altera una actividad

    //Relaciones Espacio
    espacio.belongsToMany(actividad, { through: 'Join_Actividad_Espacio', foreignKey: { name: 'espacio_id', allowNull: false } }); //Un espacio tiene una o más actividades
    espacio.belongsToMany(docente, { through: asistencia, foreignKey: {name: 'espacio_id', allowNull: false } }); //Un espacio es ocupado por docentes en actividades

    //Relaciones Asignatura
    asignatura.belongsToMany(grupo, { through: clase, foreignKey: { name: 'asignatura_id' } }); //Una asignatura tiene uno o más grupos
    asignatura.belongsTo(plan, { foreignKey: { name: 'plan_id', allowNull: false } }); //Una asignatura es contenida en un plan

    //Relaciones Grupo
    grupo.belongsToMany(asignatura, { through: clase, foreignKey: { name: 'grupo_id' } }); //Un grupo es contenido en una o más asignaturas

    //Relaciones Clase
    clase.belongsToMany(actividad, { through: 'Join_Actividad_Clase', foreignKey: { name: 'clase_id' } }); //Una clase tiene varias actividades 
 
    //Relaciones Plan
    plan.belongsTo(titulacion, { foreignKey: { name: 'titulacion_id', allowNull: false } }); //Un plan es ofrecido en una titulación
    plan.hasMany(asignatura); //Un plan tiene una o más asignaturas

    //Relaciones Titulacion
    titulacion.hasMany(plan); //Una titulación ofrece uno o más planes
}

module.exports = { relate };