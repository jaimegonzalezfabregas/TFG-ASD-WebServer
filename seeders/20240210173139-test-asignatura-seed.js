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
      {id: 803275, nombre: 'Programación Declarativa', siglas: 'PD', departamento: 'SIC', periodo: 1, plan_id: 1},
      {id: 805348, nombre: 'Metodos Algoritmicos en Resolución de Problemas I', siglas: 'MAR1', departamento: 'SIC', periodo: 1, plan_id: 1}
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
