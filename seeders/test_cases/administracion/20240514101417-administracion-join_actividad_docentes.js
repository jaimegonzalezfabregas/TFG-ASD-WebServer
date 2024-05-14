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
    return await queryInterface.bulkInsert('Join_Actividad_Docentes', [
      {actividad_id: 1, docente_id: 5},
      {actividad_id: 2, docente_id: 3},
      {actividad_id: 3, docente_id: 2},
      {actividad_id: 4, docente_id: 4},
      {actividad_id: 5, docente_id: 6},      
      {actividad_id: 6, docente_id: 4},
      {actividad_id: 7, docente_id: 2},
      {actividad_id: 8, docente_id: 6},
      {actividad_id: 9, docente_id: 3},
      {actividad_id: 10, docente_id: 5},
      {actividad_id: 11, docente_id: 3},
      {actividad_id: 12, docente_id: 4},
      {actividad_id: 13, docente_id: 5},
      {actividad_id: 14, docente_id: 6}
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     return await queryInterface.bulkDelete('Join_Actividad_Docentes', null, {});
  }
};
