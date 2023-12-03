//IMPORTANTE: Hacer await Plan.sync() tras llamar a la siguiente función

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

    return Plan;
}

module.exports = { model };