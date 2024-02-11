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
    return await queryInterface.createTable('Join_Actividad_Clase', {
      actividad_id: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'Actividad',
          key: 'id'
        },
        primaryKey: true
      },
      clase_id: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'Clase',
          key: 'id'
        },
        primaryKey: true
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
    return await queryInterface.dropTable('Join_Actividad_Clase');
  }
};
