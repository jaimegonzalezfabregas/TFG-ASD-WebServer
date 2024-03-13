//IMPORTANTE: Hacer await Titulacion.sync() o sequelize.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Titulacion = sequelize.define('Titulacion', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },      
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        siglas: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        freezeTableName: true,
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn'
    });

    Titulacion.associate = function (models) {
        models.Titulacion.hasMany(models.Plan, { as: 'con_planes', foreignKey: 'titulacion_id'}); //Una titulación ofrece uno o más planes
    };

    return Titulacion;
}

module.exports = { model };