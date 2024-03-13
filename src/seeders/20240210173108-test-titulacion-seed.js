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
    return await queryInterface.bulkInsert('Titulacion', [
      {id: 1, nombre: 'Grado en Ingeniería Informática', siglas: 'GI'},
      {id: 2, nombre: 'Grado en Ingeniería del Software', siglas: 'GS'},
      {id: 3, nombre: 'Grado en Ingeniería de Computadores', siglas: 'GC'},
      {id: 4, nombre: 'Grado en Ingeniería de Datos e Inteligencia Artificial', siglas: 'GIDIA'},
      {id: 5, nombre: 'Grado en Diseño de Videojuegos', siglas: 'GDV'},
      {id: 6, nombre: 'Doble Grado en Ingeniería Informática - Matemáticas', siglas: 'DG'},
      {id: 7, nombre: 'Doble Grado en Administación y Dirección de Empresas - Ingeniería Informática', siglas: 'ADE-GI'},
      {id: 8, nombre: 'Máster en Ingeniería Informática (2019)', siglas: 'MII (2019)'},
      {id: 9, nombre: 'Máster en Métodos Formales en Ingeniería Informática', siglas: 'MMF'},
      {id: 10, nombre: 'Máster en Ingeniería de Sistemas y de Control', siglas: 'MISC'}, // Compartido con la UNED
      {id: 11, nombre: 'Máster en Internet de las Cosas', siglas: 'IoT'}
    ]);
    
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return await queryInterface.bulkDelete('Titulacion', null, {});
  }
};
