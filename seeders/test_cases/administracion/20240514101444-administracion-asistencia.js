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
    return await queryInterface.bulkInsert('Asistencia', [
      {id: 1, espacio_id: 1, docente_id: 5, fecha: '2024-05-16 14:00:00', motivo: 'Enfermedad', estado: 'No Asistida'},
      {id: 2, espacio_id: 2, docente_id: 3, fecha: '2024-05-16 16:20:32', estado: 'Asistida'},
      {id: 3, espacio_id: 3, docente_id: 2, fecha: '2024-05-16 08:10:24', motivo: 'Cambio de aula', estado: 'Asistida con Irregularidad'},
      {id: 4, espacio_id: 4, docente_id: 4, fecha: '2024-05-16 09:00:00', estado: 'No Asistida'},
      {id: 5, espacio_id: 26, docente_id: 6, fecha: '2024-05-16 07:23:10', estado: 'Asistida'},
      {id: 6, espacio_id: 20, docente_id: 4, fecha: '2024-05-16 07:00:00', motivo: 'Enfermedad', estado: 'No Asistida'},
      {id: 7, espacio_id: 5, docente_id: 2, fecha: '2024-05-16 10:00:00', motivo: 'Aviso de sustituto', estado: 'No Asistida'},
      {id: 8, espacio_id: 5, docente_id: 5, fecha: '2024-05-16 10:04:48', motivo: 'Sustitución', estado: 'Asistida con Irregularidad'},
      {id: 9, espacio_id: 6, docente_id: 6, fecha: '2024-05-16 10:47:29', estado: 'Asistida'},
      {id: 10, espacio_id: 10, docente_id: 3, fecha: '2024-05-16 13:00:00', estado: 'No Asistida'},
      {id: 11, espacio_id: 10, docente_id: 2, fecha: '2024-05-16 13:20:01', motivo: 'Sustitución', estado: 'Asistida con Irregularidad'},
      {id: 12, espacio_id: 8, docente_id: 5, fecha: '2024-05-16 11:09:52', estado: 'Asistida'},
      {id: 13, espacio_id: 11, docente_id: 3, fecha: '2024-05-16 15:00:00', estado: 'No Asistida'},
      {id: 14, espacio_id: 9, docente_id: 4, fecha: '2024-05-16 15:00:00', estado: 'No Asistida'},
      {id: 15, espacio_id: 4, docente_id: 5, fecha: '2024-05-16 17:00:00', estado: 'No Asistida'},
      {id: 16, espacio_id: 17, docente_id: 6, fecha: '2024-05-16 08:01:00', estado: 'Asistida'}
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     return await queryInterface.bulkDelete('Asistencia', null, {});
  }
};
