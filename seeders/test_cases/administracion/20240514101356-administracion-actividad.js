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
    return await queryInterface.bulkInsert('Actividad', [
      {id: 1, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '16:00', tiempo_fin: '17:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 5},
      {id: 2, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '18:00', tiempo_fin: '19:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 3},
      {id: 3, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '10:00', tiempo_fin: '10:50', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 2},
      {id: 4, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '11:00', tiempo_fin: '12:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 4},
      {id: 5, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '09:00', tiempo_fin: '09:50', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 6},
      {id: 6, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '09:00', tiempo_fin: '10:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 4},
      {id: 7, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '12:00', tiempo_fin: '12:50', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 2},
      {id: 8, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '12:00', tiempo_fin: '13:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 6},
      {id: 9, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '15:00', tiempo_fin: '16:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 3},
      {id: 10, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '13:00', tiempo_fin: '13:50', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 5},
      {id: 11, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '17:00', tiempo_fin: '18:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 3},
      {id: 12, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '17:00', tiempo_fin: '17:50', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 4},
      {id: 13, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '19:00', tiempo_fin: '19:50', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 5},
      {id: 14, fecha_inicio: '2024-02-01 09:00:00', tiempo_inicio: '10:00', tiempo_fin: '11:40', es_todo_el_dia: 'No', es_recurrente: 'Sí', creadoPor: 'Galdo', responsable_id: 6}
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
