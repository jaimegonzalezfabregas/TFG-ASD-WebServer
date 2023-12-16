//IMPORTANTE: Hacer await Asignatura.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Asignatura = sequelize.define('Asignatura', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        siglas: {
            type: DataTypes.STRING,
            allowNull: false
        },
        departamento: {
            type: DataTypes.STRING,
            allowNull: true
        },
        periodo: {
            type: DataTypes.ENUM('1', '2'),
            allowNull: false
        }
    }, {
        freezeTableName: true
    });

    return Asignatura;
}

module.exports = { model };