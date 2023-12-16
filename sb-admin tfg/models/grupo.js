//IMPORTANTE: Hacer await Grupo.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Grupo = sequelize.define('Grupo', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        curso: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        letra: {
            type: DataTypes.STRING(1),
            allowNull: false
        }
    }, {
        freezeTableName: true,
        indexes: [
            {
                unique: true,
                fields: ['curso', 'letra']
            }
        ]
    });

    return Grupo;
}

module.exports = { model };