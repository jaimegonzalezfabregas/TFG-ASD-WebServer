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

    return await queryInterface.createTable('Clase', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      asignatura_id: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'Asignatura',
          key: 'id'
        }
      },
      grupo_id: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'Grupo',
          key: 'id'
        }
      },
    }, { 
      freezeTableName: true,
      indexes: [
        {
          unique: true,
          fields: ['asignatura_id', 'grupo_id']
        } 
      ],
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
    return await queryInterface.dropTable('Clase');
  }
};
