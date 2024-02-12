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
    return await queryInterface.bulkInsert('Docente', [
      {nombre: 'Marta', apellidos: 'Estévez García', email: 'maestga@fdi.ucm.es', password: '$2b$04$wLEiuS.XWrJ5.46HVdNSoOHqR9tV3scXUnQIKkq2boTExDh2rWapu', rol: 'Admin', secret: "P4EAE3S2IJBEKYRR"},
      {nombre: 'Alejandro', apellidos: 'Ortiz Perseida', email: 'alejop@fdi.ucm.es', password: '$2b$04$dh1HMKzSdaOvjoZFpQeN1.qheU.v8B0m.AWY4WkJKejr4NBi6jioS', rol: 'Decanato', secret: "IA7FADD2INHAC4YD"},
      {nombre: 'Marcelo', apellidos: 'Adilo Orense', email: 'marcador@fdi.ucm.es', password: '$2b$04$CllYtypIyBrkpXALjvBYveFIe7eKUiw.dJwK2Ny4kQTiPDynZpNg2', rol: 'Usuario', secret: "AEZCQ2TXM42BWMSU"}
    ]);

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return await queryInterface.bulkDelete('Docente', null, {});
  }
};
