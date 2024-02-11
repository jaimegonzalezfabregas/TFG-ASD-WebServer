'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    return await queryInterface.bulkInsert('Asignatura', [
      {id: 802239, nombre: 'Programación Declarativa', siglas: 'PD', periodo: 1, plan_id: '2019'},
      {id: 805315, nombre: 'Metodos Algoritmicos en Resolución de Problemas I', siglas: 'MAR1', periodo: 1, plan_id: '2019'}
    ]);
    
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return await queryInterface.bulkDelete('Asignatura', null, {});
  }
};
