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
    await queryInterface.bulkDelete('Join_Actividad_Espacio', null, {});
    return await queryInterface.bulkInsert('Join_Actividad_Espacio', [
      {actividad_id: 1, espacio_id: 1},
      {actividad_id: 2, espacio_id: 2},
      {actividad_id: 3, espacio_id: 3},
      {actividad_id: 4, espacio_id: 4},
      {actividad_id: 5, espacio_id: 27}, 
      {actividad_id: 5, espacio_id: 26},     
      {actividad_id: 6, espacio_id: 20},
      {actividad_id: 7, espacio_id: 5},
      {actividad_id: 8, espacio_id: 6},
      {actividad_id: 9, espacio_id: 10},
      {actividad_id: 10, espacio_id: 8},
      {actividad_id: 11, espacio_id: 11},
      {actividad_id: 12, espacio_id: 9},
      {actividad_id: 13, espacio_id: 4},
      {actividad_id: 14, espacio_id: 17}
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return await queryInterface.bulkDelete('Join_Actividad_Espacio', null, {});
  }
};
