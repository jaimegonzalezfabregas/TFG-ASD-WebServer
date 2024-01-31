//IMPORTANTE: Hacer await Join_Actividad_Clase.sync() o sequelize.sync() tras llamar a la siguiente función

//Tabla de la relación asiste (Clase asiste Actividad)
function model(sequelize, DataTypes) {
    
    const Join_Actividad_Clase = sequelize.define('Join_Actividad_Clase', {
    }, {
        freezeTableName: true
    });

    return Join_Actividad_Clase;
}

module.exports = { model };