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
      {id: 1, nombre: 'Marta', apellidos: 'Estévez García', email: 'maestga@fdi.ucm.es', password: '$2b$04$wLEiuS.XWrJ5.46HVdNSoOHqR9tV3scXUnQIKkq2boTExDh2rWapu', rol: 'Admin'}, //asdf
      {id: 2, nombre: 'Alejandro', apellidos: 'Ortiz Perseida', email: 'alejop@fdi.ucm.es', password: '$2b$04$dh1HMKzSdaOvjoZFpQeN1.qheU.v8B0m.AWY4WkJKejr4NBi6jioS', rol: 'Decanato'}, //fdsa
      {id: 3, nombre: 'Marcelo', apellidos: 'Adilo Orense', email: 'marcador@fdi.ucm.es', password: '$2b$04$CllYtypIyBrkpXALjvBYveFIe7eKUiw.dJwK2Ny4kQTiPDynZpNg2', rol: 'Usuario'}, //sdfg
      {id: 4, nombre: 'Ignacio', apellidos: 'Ifudil González', email: 'ignifugo@fdi.ucm.es', password: '$2b$04$kFXj7WjvGlCdjbELHBqsE.m900lLOByrnGQMbXlfz9JNYwnU9uHIW', rol: 'Usuario'}, //zxcv
      {id: 5, nombre: 'Rosa', apellidos: 'Alés Escalada', email: 'rosales@fdi.ucm.es', password: '$2b$04$OtsoOBYy8m5YN/8YIgovX.ogDDVQ20Ey3.AsgFYp30wh1TCDRG5N2', rol: 'Usuario'}, // vcxz
      {id: 6, nombre: 'Pedro', apellidos: 'Renedo Nevado', email: 'perenne@fdi.ucm.es', password: '$2b$04$VAUPV3wHC9AEgGtDBOd6xuiTyRyIYpEyAYYFdvevmQLtnKPaYNafq', rol: 'Usuario'} //qwer
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
