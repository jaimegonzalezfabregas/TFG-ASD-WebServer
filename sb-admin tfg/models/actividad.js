//IMPORTANTE: Hacer await Actividad.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Actividad = sequelize.define('Actividad', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
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
            type: DataTypes.STRING,
            allowNull: true,
            // validate: {
            //     is: ["^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"]
            // }
        },
        tiempo_fin: { //Tipo timestamp
            type: DataTypes.STRING,
            allowNull: true,
            // validate: {
            //     is: ["^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"]
            // }
        },
        // asistencia: {
        //     type: DataTypes.ENUM('Asistida', 'Asistida con Irregularidad', 'No Asistida', 'Aún sin realizar'),
        //     allowNull: false,
        //     defaultValue: 'Aún sin realizar'
        // },
        es_todo_el_dia: {
            type: DataTypes.ENUM('Sí', 'No'),
            allowNull: false
        },
        es_recurrente: {
            type: DataTypes.ENUM('Sí', 'No'),
            allowNull: false
        },
        creado_por: {
            type: DataTypes.STRING
        } //La fecha de creación de este atributo la guarda automáticamente sequelize
    }, {
        freezeTableName: true
    });

    return Actividad;
}

module.exports = { model };