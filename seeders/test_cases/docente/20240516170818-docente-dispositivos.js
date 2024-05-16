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
    
    // return await queryInterface.bulkInsert('Dispositivo', [{
    //   id: 1, 
    //   nombre: 'Lector QR, BLE, NFC',
    //   espacioId: 10,
    //   idExternoDispositivo: '',
    //   creadoPor: 1,
    //   actualizadoPor: 1,
    //   endpointSeguimiento: '/seguimiento',
    //   t0: 0,
    //   secret: 'KMUWADJUAUYGG72R'
    // }], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     return await queryInterface.bulkDelete('Dispositivo', null, {});
  }
};
