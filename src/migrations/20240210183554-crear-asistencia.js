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
    return await queryInterface.createTable('Asistencia', {
      id: {
          type: Sequelize.DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
      },
      docente_id: {
          type: Sequelize.DataTypes.INTEGER,
          references: {
              model: 'Docente',
              key: 'id'
          }
      },
      espacio_id: {
          type: Sequelize.DataTypes.INTEGER,
          references: {
              model: 'Espacio',
              key: 'id'
          }
      },
      fecha: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false
      },
      estado: {
          type: Sequelize.DataTypes.ENUM('Asistida', 'Asistida con Irregularidad', 'No Asistida'),
          allowNull: false,
          defaultValue: 'No Asistida'
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
          fields: ['docente_id', 'espacio_id', 'fecha'] //Solo docente y fecha o todos??
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
    return await queryInterface.dropTable('Asistencia');
  }
};
