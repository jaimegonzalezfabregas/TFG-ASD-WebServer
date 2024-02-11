//IMPORTANTE: Hacer await Titulacion.sync() o sequelize.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Titulacion = sequelize.define('Titulacion', {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        },
    }, {
        freezeTableName: true,
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn'
    });

    Titulacion.associate = function (models) {
        models.Titulacion.hasMany(models.Plan, { as: 'con_planes'}); //Una titulación ofrece uno o más planes
    };

    return Titulacion;
}

module.exports = { model };