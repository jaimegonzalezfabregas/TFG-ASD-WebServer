//IMPORTANTE: Hacer await Espacio.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Espacio = sequelize.define('Espacio', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoincrement: true
        },
        numero: {
            type: DataTypes.INTEGER,
            allowNull: false,
            uniqueTriad: true
        },
        tipo: {
            type: DataTypes.ENUM('Aula', 'Laboratorio'),
            allowNull: false,
            uniqueTriad: true
        },
        edificio: {
            type: DataTypes.STRING,
            allowNull: false,
            uniqueTriad: true
        }
    }, {
        freezeTableName: true,
        indexes: [
            {
                unique: true,
                fields: ['numero', 'tipo', 'edificio']
            }
        ]
    });

    return Espacio;
}

module.exports = { model };