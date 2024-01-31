// Para llamar a esta función, sequelize debe haber definido todos los modelos que se importan como const
async function relate_for_api(sequelize) {

    const espacio = sequelize.models.Espacio;
    const dispositivos = sequelize.models.Dispositivo;

    // Relación Espacio 1-N Dispositivo (Un espacio asociado a un dispositivo y viceversa)
    espacio.hasMany(dispositivos, { as: 'registrar', foreignKey: { name: 'espacioId', allowNull: false }  });
    dispositivos.belongsTo(espacio, { as: 'registrar', foreignKey: { name: 'espacioId', allowNull: false } });
}

module.exports = { relate_for_api };