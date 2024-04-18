'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return await queryInterface.createTable('Actividad', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      fecha_inicio: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      fecha_fin: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true
      },
      tiempo_inicio: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
      },
      tiempo_fin: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
      },
      es_todo_el_dia: {
        type: Sequelize.DataTypes.ENUM('Sí', 'No'),
        allowNull: false
      },
      es_recurrente: {
        type: Sequelize.DataTypes.ENUM('Sí', 'No'),
        allowNull: false
      },
      creadoPor: {
        type: Sequelize.DataTypes.STRING
      },
      actividad_padre_id: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'Actividad',
          key: 'id'
        }
      },
      responsable_id: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'Docente',
          key: 'id'
        }
      },      
      //Timestamps
      creadoEn: {
        type: Sequelize.DataTypes.DATE,
        defaultValue: Sequelize.fn('NOW'),
        allowNull: false
      },
      actualizadoEn: {
        type: Sequelize.DataTypes.DATE,
        defaultValue: Sequelize.fn('NOW'),
        onUpdate: Sequelize.fn('NOW'),
        allowNull: false
      }
    }, {
      freezeTableName: true
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return await queryInterface.dropTable('Actividad');
  }
};
