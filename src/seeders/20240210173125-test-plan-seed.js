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
    return await queryInterface.bulkInsert('Plan', [
      {id: 1, año: '2019', titulacion_id: 1},
      {id: 2, año: '2019', titulacion_id: 2},
      {id: 3, año: '2019', titulacion_id: 3},
      {id: 4, año: '2022', titulacion_id: 4},
      {id: 5, año: '2019', titulacion_id: 5},
      {id: 6, año: '2019', titulacion_id: 6},
      {id: 7, año: '2019', titulacion_id: 7},
      {id: 8, año: '2019', titulacion_id: 8},
      {id: 9, año: '2019', titulacion_id: 9},
      {id: 10, año: '2019', titulacion_id: 10}, // Compartido con la UNED
      {id: 11, año: '2019', titulacion_id: 11}
    ]);
    
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return await queryInterface.bulkDelete('Plan', null, {});
  }
};
