//IMPORTANTE: Hacer await Excepcion.sync() o sequelize.sync() tras llamar a la siguiente función

/* Sobre el uso de Excepción:
    fecha_inicio_act y fecha_fin_act contienen el inicio y fin de la actividad cancelada o reprogramada
    fecha_inicio_ex y fecha_fin_ex contienen el inicio y fin de la reprogramación de una actividad (pueden ser nulos si esta_reprogramado == 'No')
    esta_cancelado == 'Sí' && esta_reprogramado == 'No => Actividad cancelada
    esta_cancelado == 'No' && esta_reprogramado == 'Sí => Actividad reprogramada
    esta_cancelado == 'Sí' && esta_reprogramado == 'Sí => Actividad reprogramada, que luego ha sido cancelada
    La reprogramación de una reprogramación se contempla con el caso de que fecha_inicio_act y fecha_fin_act coincidan con algún
    par fecha_inicio_ex y fecha_fin_ex
*/

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
            allowNull: false,
            defaultValue: 'No'
        },
        fecha_inicio_act: {
            type: DataTypes.DATE,
            allowNull: false
        },
        fecha_fin_act: {
            type: DataTypes.DATE,
            allowNull: true
        },
        fecha_inicio_ex: {
            type: DataTypes.DATE,
            allowNull: true
        },
        fecha_fin_ex: { 
            type: DataTypes.DATE,
            allowNull: true
        },
        es_todo_el_día: {
            type: DataTypes.ENUM('Sí', 'No'),
            allowNull: false,
            defaultValue: 'No'
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