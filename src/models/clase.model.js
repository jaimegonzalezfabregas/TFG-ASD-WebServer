//IMPORTANTE: Hacer await Clase.sync() o sequelize.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Clase = sequelize.define('Clase', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        }
    }, { 
        freezeTableName: true,
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn' }
    ); //Tabla de la agrupación asignatura y grupo

    Clase.associate = function(models) {
        models.Clase.belongsToMany(models.Actividad, { as: 'con_sesiones', through: { model: models.Join_Actividad_Clase }, foreignKey: 'clase_id'}); //Una clase tiene varias actividades 
    };

    return Clase;
}

module.exports = { model };