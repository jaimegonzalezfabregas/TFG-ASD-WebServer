//IMPORTANTE: Hacer await Espacio.sync() o sequelize.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Espacio = sequelize.define('Espacio', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        },
        creadoEn: {
            type: DataTypes.DATE,
            allowNull: false
        },
        actualizadoEn: {
            type: DataTypes.DATE,
            allowNull: false
        },
        creadoPor: {
            type: DataTypes.STRING,
            allowNull: false
        },
        actualizadoPor: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        freezeTableName: true,
        indexes: [
            {
                unique: true,
                fields: ['numero', 'tipo', 'edificio']
            }
        ],
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn'
    });

    Espacio.associate = function (models) {
        models.Espacio.belongsToMany(models.Actividad, { as: 'ocupado_por', through: { model: models.Join_Actividad_Espacio, foreignKey: 'espacio_id', allowNull: false }, foreignKey: 'espacio_id' }); //Un espacio tiene una o más actividades
        models.Espacio.belongsToMany(models.Docente, { as: 'con_actividad_impartida_por', through: { model: models.Asistencia, foreignKey: 'espacio_id', allowNull: false }, foreignKey: 'espacio_id' }); //Un espacio es ocupado por docentes en actividades     
    };

    return Espacio;
}

module.exports = { model };