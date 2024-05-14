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
    return await queryInterface.bulkInsert('Join_Actividad_Clase', [
      {actividad_id: 1, clase_id: 1},
      {actividad_id: 2, clase_id: 2},
      {actividad_id: 3, clase_id: 3},
      {actividad_id: 3, clase_id: 4},
      {actividad_id: 4, clase_id: 5},
      {actividad_id: 5, clase_id: 6},      
      {actividad_id: 6, clase_id: 7},
      {actividad_id: 7, clase_id: 8},
      {actividad_id: 7, clase_id: 9},
      {actividad_id: 7, clase_id: 10},
      {actividad_id: 8, clase_id: 11},
      {actividad_id: 9, clase_id: 12},
      {actividad_id: 10, clase_id: 13},
      {actividad_id: 11, clase_id: 14},
      {actividad_id: 12, clase_id: 15},
      {actividad_id: 13, clase_id: 16},
      {actividad_id: 14, clase_id: 17},
      {actividad_id: 14, clase_id: 18}
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     return await queryInterface.bulkDelete('Join_Actividad_Clase', null, {});
  }
};
