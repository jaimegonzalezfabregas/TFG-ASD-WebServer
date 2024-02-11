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
    return await queryInterface.createTable('Recurrencia', {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
      },
      tipo_recurrencia: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false
      },
      separacion: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true
      },
      maximo: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true
      },
      dia_semana: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true
      },
      semanaMes: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true
      },
      dia_mes: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true
      },
      mes_anio: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true
      },
      actividad_id: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: 'Actividad',
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
    return await queryInterface.dropTable('Recurrencia');
  }
};
