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
    return await queryInterface.createTable('Join_Actividad_Espacio', {
      actividad_id: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'Actividad',
          key: 'id'
        },
        primaryKey: true
      },
      espacio_id: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'Espacio',
          key: 'id'
        },
        primaryKey: true
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
    return await queryInterface.dropTable('Join_Actividad_Espacio');
  }
};
