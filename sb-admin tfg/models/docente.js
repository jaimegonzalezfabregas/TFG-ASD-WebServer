//IMPORTANTE: Hacer await Docente.sync() tras llamar a la siguiente función

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
            type: DataTypes.ENUM('Usuario', 'Decanato', 'Administrador'),
            defaultValue: 'Usuario'
        }
    }, {
        freezeTableName: true
    });

    return Docente;
}

module.exports = { model };