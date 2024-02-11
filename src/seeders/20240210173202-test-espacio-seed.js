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
      {numero: 1, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 2, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 3, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 4, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 5, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 6, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 7, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 8, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 9, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 10, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 11, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 12, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 13, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 14, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 15, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 16, tipo: 'Aula', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 1, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 2, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 3, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 4, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 5, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 6, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 7, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 8, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 9, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 10, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 11, tipo: 'Laboratorio', edificio: 'FdI', creadoPor: 1, actualizadoPor: 1},
      {numero: 1008, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1},
      {numero: 1208, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1},
      {numero: 1210, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1},
      {numero: 1218, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1},
      {numero: 1220, tipo: 'Aula', edificio: 'Multiusos', creadoPor: 1, actualizadoPor: 1}
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
