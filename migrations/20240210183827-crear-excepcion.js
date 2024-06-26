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
    return await queryInterface.createTable('Excepcion', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      }, //Las foreign keys se crean al relacionar.
      esta_reprogramado: {
        type: Sequelize.DataTypes.ENUM('Sí', 'No'),
        allowNull: false,
        defaultValue: 'No'
      },
      esta_cancelado: {
        type: Sequelize.DataTypes.ENUM('Sí', 'No'),
        allowNull: false,
        defaultValue: 'No'
      },
      fecha_inicio_act: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      fecha_fin_act: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true
      },
      fecha_inicio_ex: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true
      },
      fecha_fin_ex: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true
      },
      es_todo_el_día: {
        type: Sequelize.DataTypes.ENUM('Sí', 'No'),
        allowNull: false,
        defaultValue: 'No'
      },
      creado_por: {
        type: Sequelize.DataTypes.STRING
      }, 
      actividad_id: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'Actividad',
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
    return await queryInterface.dropTable('Excepcion');
  }
};
