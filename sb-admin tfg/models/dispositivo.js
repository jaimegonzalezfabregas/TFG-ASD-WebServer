//IMPORTANTE: Hacer await Dispositivos.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {
    
    const Dispositivo = sequelize.define('Dispositivo', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        espacioId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        idExternoDispositivo: {
            type: DataTypes.STRING,
            allowNull: false
        },
        creadoPor: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        actualizadoPor: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        endpointSeguimiento: {
            type: DataTypes.STRING,
            allowNull: false
        },
        t0: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        secret: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        freezeTableName: true
    });

    return Dispositivo;
}

module.exports = { model };