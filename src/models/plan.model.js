//IMPORTANTE: Hacer await Plan.sync() o sequelize.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Plan = sequelize.define('Plan', {
        id: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        }
    }, {
        freezeTableName: true
    });

    Plan.associate = function (models) {
        models.Plan.belongsTo(models.Titulacion, { as: 'de_titulacion', foreignKey: 'titulacion_id', allowNull: false }); //Un plan es ofrecido en una titulación
        models.Plan.hasMany(models.Asignatura, { as: 'con_asignaturas' }); //Un plan tiene una o más asignaturas
    };

    return Plan;
}

module.exports = { model };