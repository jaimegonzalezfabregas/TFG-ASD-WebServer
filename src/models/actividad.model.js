//IMPORTANTE: Hacer await Actividad.sync() o sequelize.sync() tras llamar a la siguiente función

function model(sequelize, DataTypes) {

    const Actividad = sequelize.define('Actividad', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        fecha_inicio: {
            type: DataTypes.DATE,
            allowNull: false
        },
        fecha_fin: {
            type: DataTypes.DATE,
            allowNull: true
        },
        tiempo_inicio: { //Tipo timestamp
            type: DataTypes.STRING,
            allowNull: true,
            // validate: {
            //     is: ["^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"]
            // }
        },
        tiempo_fin: { //Tipo timestamp
            type: DataTypes.STRING,
            allowNull: true,
            // validate: {
            //     is: ["^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"]
            // }
        },
        es_todo_el_dia: {
            type: DataTypes.ENUM('Sí', 'No'),
            allowNull: false
        },
        es_recurrente: {
            type: DataTypes.ENUM('Sí', 'No'),
            allowNull: false
        },
        creado_por: {
            type: DataTypes.STRING
        } //La fecha de creación de este atributo la guarda automáticamente sequelize
    }, {
        freezeTableName: true,
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn'
    });

    Actividad.associate = function (models) {
        //Una actividad puede tener varias como hijo (procede de)
        models.Actividad.hasMany(models.Actividad, 
            { as: 'actividad_padre' }
        ); 
        //Una actividad puede tener otra como padre (procede de)
        models.Actividad.belongsTo(models.Actividad, 
            { as: 'actividad_hija',
            foreignKey: 'actividad_padre_id' }
        ); 
        //Una actividad puede seguir varios tipos de recurrencia (sigue)
        models.Actividad.hasMany(models.Recurrencia, 
            { as: 'con_recurrencia'}
        ); 
        //Una actividad puede tener varias excepciones (altera)
        models.Actividad.hasMany(models.Excepcion, 
            { as: 'con_excepcion' }
        ); 
        models.Actividad.belongsToMany(models.Docente, 
            { as: 'impartida_por', 
            through: { model: models.Join_Actividad_Docentes, foreignKey: 'actividad_id', allowNull: false }, 
            foreignKey: 'actividad_id' }
        ); //Una actividad tiene uno o más docentes asignados (imparte)
        models.Actividad.belongsTo(models.Docente, 
            { as: 'con_responsable', 
            foreignKey: { name: 'responsable_id', allowNull: false } }
        ); //Una actividad tiene un docente responsable (responsable)
        models.Actividad.belongsToMany(models.Espacio, 
            { as: 'impartida_en', 
            through: { model: models.Join_Actividad_Espacio, foreignKey: 'actividad_id', allowNull: false },
            foreignKey: 'actividad_id' }
        ); //Una actividad ocupa uno o más espacios (en)
        models.Actividad.belongsToMany(models.Clase, 
            { as: 'sesion_de', 
            through: { model: models.Join_Actividad_Clase, foreignKey: 'actividad_id', allowNull: false }, 
            foreignKey: 'actividad_id' }
        ); //Una actividad puede ser de una o más clases (asiste)    
    };

    return Actividad;
}

module.exports = { model };