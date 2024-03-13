//IMPORTANTE: Hacer await Asistencia.sync() o sequelize.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Asistencia = sequelize.define('Asistencia', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        docente_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Docente',
                key: 'id'
            }
        },
        espacio_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Espacio',
                key: 'id'
            }
        },
        fecha: {
            type: DataTypes.DATE,
            allowNull: false
        },
        estado: {
            type: DataTypes.ENUM('Asistida', 'Asistida con Irregularidad', 'No Asistida'),
            allowNull: false,
            defaultValue: 'No Asistida'
        },
        motivo: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        freezeTableName: true,
        indexes: [
            {
                unique: true,
                fields: ['docente_id', 'espacio_id', 'fecha'] //Solo docente y fecha o todos??
            }
        ],
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn'
    });

    return Asistencia;
}

module.exports = { model };