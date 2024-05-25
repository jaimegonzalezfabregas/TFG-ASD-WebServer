'use strict';
const moment = require('moment');

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
    return await queryInterface.bulkInsert('Actividad', [
      {id: 1, fecha_inicio: moment().format('YYYY-MM-DD hh:mm:ss'), tiempo_inicio: '16:00', tiempo_fin: '17:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 3},
      {id: 2, fecha_inicio: moment().format('YYYY-MM-DD hh:mm:ss'), tiempo_inicio: '13:00', tiempo_fin: '19:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 3}
    ]);

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return await queryInterface.bulkDelete('Actividad', null, {});
  }
};
