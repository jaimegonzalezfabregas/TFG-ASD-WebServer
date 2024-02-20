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
    return await queryInterface.createTable('Asignatura', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      nombre: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      siglas: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      departamento: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true
      },
      periodo: {
        type: Sequelize.DataTypes.ENUM('1', '2'),
        allowNull: false
      },
      plan_id: {
        type: Sequelize.DataTypes.STRING,
        references: {
          model: 'Plan',
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
    return await queryInterface.dropTable('Asignatura');
  }
};
