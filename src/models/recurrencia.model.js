//IMPORTANTE: Hacer await Recurrencia.sync() o sequelize.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Recurrencia = sequelize.define('Recurrencia', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false
        },
        tipo_recurrencia: {
            type: DataTypes.STRING,
            allowNull: false
        },
        separacion: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        maximo: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        dia_semana: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        semanaMes: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        dia_mes: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        mes_anio: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        freezeTableName: true
    });

    Recurrencia.associate = function (models) {
        models.Recurrencia.belongsTo(models.Actividad, { as: 'recurrencia_de', foreignKey: 'actividad_id', allowNull: false }); //Una recurrencia pertenece a una actividad
    }

    return Recurrencia;
}

module.exports = { model };