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
    return await queryInterface.createTable('Grupo', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      curso: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      letra: {
        type: Sequelize.DataTypes.STRING(1),
        allowNull: false
      }
    }, {
      freezeTableName: true,
      indexes: [
        {
          unique: true,
          fields: ['curso', 'letra']
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
    return await queryInterface.dropTable('Grupo');
  }
};
