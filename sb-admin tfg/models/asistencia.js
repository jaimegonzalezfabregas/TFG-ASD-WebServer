//IMPORTANTE: Hacer await Asistencia.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Asistencia = sequelize.define('Asistencia', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
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
        }
    }, {
        freezeTableName: true,
        indexes: [
            {
                unique: true,
                fields: ['docente_id', 'espacio_id', 'fecha'] //Solo docente y fecha o todos??
            }
        ]
    });

    return Asistencia;
}

module.exports = { model };