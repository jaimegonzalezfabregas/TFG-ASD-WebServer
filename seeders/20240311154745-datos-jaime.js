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

    await queryInterface.bulkInsert('Macs', [{
      mac: '44:27:F3:09:D1:D4',
      usuario_id: 3
    }, 
    {
      mac: '64:A2:00:1C:43:9C',
      usuario_id: 3
    }], {});

    await queryInterface.bulkInsert('Nfcs', [{
      nfc: 42486097366,
      usuario_id: 3
    }], {});
    
    await queryInterface.bulkInsert('Dispositivo', [{
      id: 1, 
      nombre: 'Lector QR, BLE, NFC',
      espacioId: 10,
      idExternoDispositivo: '',
      creadoPor: 1,
      actualizadoPor: 1,
      endpointSeguimiento: '/seguimiento',
      t0: 0,
      secret: 'KMUWADJUAUYGG72R'
    }], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Macs', null, {});
    await queryInterface.bulkDelete('Nfcs', null, {});
    await queryInterface.bulkDelete('Dispositivo', null, {});
  }
};
