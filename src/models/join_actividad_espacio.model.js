//IMPORTANTE: Hacer await Join_Actividad_Espacio.sync() o sequelize.sync() tras llamar a la siguiente función

//Tabla de la relación en (Actividad en Espacio) 
function model(sequelize, DataTypes) {
    
    const Join_Actividad_Espacio = sequelize.define('Join_Actividad_Espacio', {
    }, {
        freezeTableName: true,
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn'
    });

    return Join_Actividad_Espacio;
}

module.exports = { model };