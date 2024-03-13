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
    return await queryInterface.createTable('Nfcs', {
      nfc: {
        type: Sequelize.DataTypes.BIGINT,
        primaryKey: true
      },
      usuario_id: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'Docente',
          key: 'id'
        },
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
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return await queryInterface.dropTable('Nfcs')
  }
};
