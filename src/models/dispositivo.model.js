//IMPORTANTE: Hacer await Dispositivos.sync() o sequelize.sync() tras llamar a la siguiente función

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
        freezeTableName: true,
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn'
    });

    Dispositivo.associate = function (models) {
        models.Dispositivo.belongsTo(models.Espacio, { as: 'registrar', foreignKey: 'espacioId', allowNull: false }); //Un dispositivo puede estar asociado a varios espacios
    };

    return Dispositivo;
}

module.exports = { model };