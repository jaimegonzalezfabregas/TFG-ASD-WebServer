//IMPORTANTE: Hacer await Docente.sync() o sequelize.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {
    
    const Docente = sequelize.define('Docente', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        apellidos: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        rol: {
            type: DataTypes.ENUM('Usuario', 'Decanato', 'Admin'),
            defaultValue: 'Usuario'
        }
    }, {
        freezeTableName: true,
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn'
    });

    Docente.associate = function (models) {
        models.Docente.hasMany(models.Actividad, { as: 'responsable' }); //Un docente es responsable de varias clases (responsable)
        models.Docente.belongsToMany(models.Actividad, { as: 'imparte', through: { model: models.Join_Actividad_Docentes, foreignKey: 'docente_id', allowNull: false }, foreignKey: 'docente_id' }); //Un docente imparte varias clases (imparte)
        models.Docente.belongsToMany(models.Espacio, { as: 'ha_impartido', through: { model: models.Asistencia, foreignKey: 'docente_id', allowNull: false }, foreignKey: 'docente_id' }); //Un docente asiste a varios espacios para realizar actividades

    };

    return Docente;
}

module.exports = { model };