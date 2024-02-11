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
        allowNull: false,
        autoIncrement: true
      }, //Las foreign keys se crean al relacionar.
      esta_reprogramado: {
        type: Sequelize.DataTypes.ENUM('Sí', 'No'),
        allowNull: false
      },
      esta_cancelado: {
        type: Sequelize.DataTypes.ENUM('Sí', 'No'),
        allowNull: false
      },
      fecha_inicio: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      fecha_fin: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true
      },
      tiempo_inicio: { //Tipo timestamp
        type: Sequelize.DataTypes.DATE,
        allowNull: true
      },
      tiempo_fin: { //Tipo timestamp
        type: Sequelize.DataTypes.DATE,
        allowNull: true
      },
      es_todo_el_día: {
        type: Sequelize.DataTypes.ENUM('Sí', 'No'),
        allowNull: false
      },
      creado_por: {
        type: Sequelize.DataTypes.STRING
      }, //La fecha de creación de este atributo la guarda automáticamente sequelize
      actividad_id: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'Actividad',
          key: 'id'
        }
      }
    }, {
      freezeTableName: true,
      createdAt: 'creadoEn',
      updatedAt: 'actualizadoEn'
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
