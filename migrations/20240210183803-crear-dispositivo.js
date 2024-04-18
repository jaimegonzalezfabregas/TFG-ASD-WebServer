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
    return await queryInterface.createTable('Dispositivo', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      espacioId: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Espacio',
          key: 'id'
        }
      },
      idExternoDispositivo: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      creadoPor: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      actualizadoPor: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      endpointSeguimiento: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      t0: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      secret: {
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
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return await queryInterface.dropTable('Dispositivo');
  }
};
