//IMPORTANTE: Hacer await Docente.sync() o sequelize.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {
    
    const Macs = sequelize.define('Macs', {
        mac: {
            type: DataTypes.STRING,
            primaryKey: true,
            validate : {
                is: "^([0-9A-F]{2}[:]){5}([0-9A-F]){2}$"
            }
        }
    }, {
        freezeTableName: true,
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn'
    });

    Macs.associate = function (models) {
        models.Macs.belongsTo(models.Docente, { as: 'asociado_a', foreignKey: { name: 'usuario_id', allowNull: false }}); //Una mac pertenece a un solo docente (asociado a)
    };

    return Macs;
}

module.exports = { model };