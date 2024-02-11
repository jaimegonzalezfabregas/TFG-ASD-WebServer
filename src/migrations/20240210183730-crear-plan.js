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
    return await queryInterface.createTable('Plan', {
      id: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      titulacion_id: {
        type: Sequelize.DataTypes.STRING,
        references: {
          model: 'Titulacion',
          key: 'id'
        }
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
    return await queryInterface.dropTable('Plan');
  }
};
