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
    return await queryInterface.createTable('Espacio', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      numero: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        uniqueTriad: true
      },
      tipo: {
        type: Sequelize.DataTypes.ENUM('Aula', 'Laboratorio'),
        allowNull: false,
        uniqueTriad: true
      },
      edificio: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        uniqueTriad: true
      },
      creadoPor: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      actualizadoPor: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
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
      freezeTableName: true,
      indexes: [
        {
          unique: true,
          fields: ['numero', 'tipo', 'edificio']
        }
      ]
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return await queryInterface.dropTable('Espacio');
  }
};
