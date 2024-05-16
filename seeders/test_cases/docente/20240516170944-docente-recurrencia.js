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
    { id: 1, actividad_id: 1, tipo_recurrencia: 'Diaria' , separacion: 0},
    { id: 2, actividad_id: 2, tipo_recurrencia: 'Diaria' , separacion: 0},
    { id: 3, actividad_id: 3, tipo_recurrencia: 'Diaria' , separacion: 0},
    { id: 4, actividad_id: 4, tipo_recurrencia: 'Diaria' , separacion: 0},
    { id: 5, actividad_id: 5, tipo_recurrencia: 'Diaria' , separacion: 0},
    { id: 6, actividad_id: 6, tipo_recurrencia: 'Diaria' , separacion: 0},
    { id: 7, actividad_id: 7, tipo_recurrencia: 'Diaria' , separacion: 0},
    { id: 8, actividad_id: 8, tipo_recurrencia: 'Diaria' , separacion: 0},
    { id: 9, actividad_id: 9, tipo_recurrencia: 'Diaria' , separacion: 0},
    { id: 10, actividad_id: 10, tipo_recurrencia: 'Diaria' , separacion: 0},
    { id: 11, actividad_id: 11, tipo_recurrencia: 'Diaria' , separacion: 0},
    { id: 12, actividad_id: 12, tipo_recurrencia: 'Diaria' , separacion: 0},
    { id: 13, actividad_id: 13, tipo_recurrencia: 'Diaria' , separacion: 0},
    { id: 14, actividad_id: 14, tipo_recurrencia: 'Diaria' , separacion: 0}
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
