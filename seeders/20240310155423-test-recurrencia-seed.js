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
    
    return await queryInterface.bulkInsert('Recurrencia', [
      { id: 1, actividad_id: 1, tipo_recurrencia: 'Semanal' , separacion: 0, dia_semana: 1},
      { id: 2, actividad_id: 1, tipo_recurrencia: 'Semanal' , separacion: 0, dia_semana: 2},
      { id: 3, actividad_id: 2, tipo_recurrencia: 'Semanal' , separacion: 0, dia_semana: 3},
      { id: 4, actividad_id: 2, tipo_recurrencia: 'Semanal' , separacion: 0, dia_semana: 4},
      { id: 5, actividad_id: 2, tipo_recurrencia: 'Semanal' , separacion: 0, dia_semana: 5}
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     return await queryInterface.bulkDelete('Recurrencia', null, {});
  }
};
