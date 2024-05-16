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
    return await queryInterface.bulkInsert('Grupo', [
      {id: 1, curso: 1, letra: 'A'},
      {id: 2, curso: 1, letra: 'B'},
      {id: 3, curso: 1, letra: 'E'},
      {id: 4, curso: 2, letra: 'A'},
      {id: 5, curso: 3, letra: 'A'},
      {id: 6, curso: 4, letra: 'A'}
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     return await queryInterface.bulkDelete('Grupo', null, {});
  }
};
