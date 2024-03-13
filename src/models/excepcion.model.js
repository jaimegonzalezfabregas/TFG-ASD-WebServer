//IMPORTANTE: Hacer await Excepcion.sync() o sequelize.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Excepcion = sequelize.define('Excepcion', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
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
        freezeTableName: true,
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn'
    });

    Excepcion.associate = function (models) {
        models.Excepcion.belongsTo(models.Actividad, { as: 'excepcion_de', foreignKey: 'actividad_id', allowNull: false }); //Una excepcion altera una actividad
    };

    return Excepcion;
}

module.exports = { model };