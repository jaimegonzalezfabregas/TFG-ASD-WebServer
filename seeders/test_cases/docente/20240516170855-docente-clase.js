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
    return await queryInterface.bulkInsert('Clase', [
      {id: 1, asignatura_id: 803274, grupo_id: 5},
      {id: 2, asignatura_id: 805349, grupo_id: 5},
      {id: 3, asignatura_id: 803365, grupo_id: 5},
      {id: 4, asignatura_id: 803365, grupo_id: 6},
      {id: 5, asignatura_id: 805337, grupo_id: 1},
      {id: 6, asignatura_id: 803277, grupo_id: 5},
      {id: 7, asignatura_id: 805347, grupo_id: 4},
      {id: 8, asignatura_id: 803261, grupo_id: 1},
      {id: 9, asignatura_id: 803261, grupo_id: 2},
      {id: 10, asignatura_id: 803261, grupo_id: 3},
      {id: 11, asignatura_id: 805345, grupo_id: 4},
      {id: 12, asignatura_id: 805343, grupo_id: 2},
      {id: 13, asignatura_id: 805354, grupo_id: 5},
      {id: 14, asignatura_id: 803267, grupo_id: 4},
      {id: 15, asignatura_id: 805358, grupo_id: 4},
      {id: 16, asignatura_id: 803278, grupo_id: 6},
      {id: 17, asignatura_id: 803368, grupo_id: 5},
      {id: 18, asignatura_id: 803368, grupo_id: 6}
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     return await queryInterface.bulkDelete('Clase', null, {});
  }
};
