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
    return await queryInterface.bulkInsert('Espacio', [
      {id: 1, numero: 1, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 2, numero: 2, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 3, numero: 3, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 4, numero: 4, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 5, numero: 5, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 6, numero: 6, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 7, numero: 7, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 8, numero: 8, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 9, numero: 9, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 10, numero: 10, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 11, numero: 11, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 12, numero: 12, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 13, numero: 13, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 14, numero: 14, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 15, numero: 15, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 16, numero: 16, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 17, numero: 1, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 18, numero: 2, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 19, numero: 3, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 20, numero: 4, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 21, numero: 5, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 22, numero: 6, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 23, numero: 7, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 24, numero: 8, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 25, numero: 9, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 26, numero: 10, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 27, numero: 11, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {id: 28, numero: 1008, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1},
      {id: 29, numero: 1208, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1},
      {id: 30, numero: 1210, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1},
      {id: 31, numero: 1218, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1},
      {id: 32, numero: 1220, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1}
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
   return await queryInterface.bulkDelete('Espacio', null, {});
  }
};
