//IMPORTANTE: Hacer await Join_Actividad_Docentes.sync() o sequelize.sync() tras llamar a la siguiente función

//Tabla de la relación imparte (Docente imparte Actividad)
function model(sequelize, DataTypes) {
    
    const Join_Actividad_Docentes = sequelize.define('Join_Actividad_Docentes', {
    }, {
        freezeTableName: true,
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn'
    });

    return Join_Actividad_Docentes;
}

module.exports = { model };