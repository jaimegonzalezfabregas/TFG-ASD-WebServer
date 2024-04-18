//IMPORTANTE: Hacer await Asignatura.sync() o sequelize.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Asignatura = sequelize.define('Asignatura', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false
        },
        siglas: {
            type: DataTypes.STRING,
            allowNull: false
        },
        departamento: {
            type: DataTypes.STRING,
            allowNull: true
        },
        periodo: {
            type: DataTypes.ENUM('1', '2', 'Anual'),
            allowNull: false
        }
    }, {
        freezeTableName: true,
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn'
    });

    Asignatura.associate = function (models) {
        models.Asignatura.belongsToMany(models.Grupo, { as: 'para_grupos', through: { model: models.Clase, foreignKey: 'asignatura_id' }, foreignKey: 'asignatura_id' }); //Una asignatura tiene uno o más grupos
        models.Asignatura.belongsTo(models.Plan, { as: 'de_plan', foreignKey: 'plan_id', allowNull: false }); //Una asignatura es contenida en un plan
    };

    return Asignatura;
}

module.exports = { model };