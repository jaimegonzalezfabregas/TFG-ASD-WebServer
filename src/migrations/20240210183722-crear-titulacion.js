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
    return await queryInterface.createTable('Titulacion', {
      id: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
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
    return await queryInterface.dropTable('Titulacion');
  }
};
