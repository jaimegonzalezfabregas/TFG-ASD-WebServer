//IMPORTANTE: Hacer await Titulacion.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Titulacion = sequelize.define('Titulacion', {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        },
    }, {
        freezeTableName: true
    });

    return Titulacion;
}

module.exports = { model };