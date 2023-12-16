//IMPORTANTE: Hacer await Excepcion.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Excepcion = sequelize.define('Excepcion', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        }, //Las foreign keys se crean al relacionar.
        esta_reprogramado: {
            type: DataTypes.ENUM('Sí', 'No'),
            allowNull: false
        },
        esta_cancelado: {
            type: DataTypes.ENUM('Sí', 'No'),
            allowNull: false
        },
        fecha_inicio: {
            type: DataTypes.DATE,
            allowNull: false
        },
        fecha_fin: {
            type: DataTypes.DATE,
            allowNull: true
        },
        tiempo_inicio: { //Tipo timestamp
            type: DataTypes.DATE,
            allowNull: true
        },
        tiempo_fin: { //Tipo timestamp
            type: DataTypes.DATE,
            allowNull: true
        },
        es_todo_el_día: {
            type: DataTypes.ENUM('Sí', 'No'),
            allowNull: false
        },
        creado_por: {
            type: DataTypes.STRING
        } //La fecha de creación de este atributo la guarda automáticamente sequelize
    }, {
        freezeTableName: true
    });

    return Excepcion;
}

module.exports = { model };