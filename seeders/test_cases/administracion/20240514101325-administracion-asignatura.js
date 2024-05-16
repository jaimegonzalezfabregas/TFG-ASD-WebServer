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
    return await queryInterface.bulkInsert('Asignatura', [
      {id: 803274, nombre: 'Programación Concurrente', siglas: 'PC', departamento: 'SIC', periodo: 2, plan_id: 1},
      {id: 805349, nombre: 'Metodos Algoritmicos en Resolución de Problemas II', siglas: 'MAR2', departamento: 'SIC', periodo: 2, plan_id: 1},
      {id: 803365, nombre: 'Inteligencia Artificial Aplicada al Control', siglas: 'IAAC', departamento: 'SIC', periodo: 2, plan_id: 1},
      {id: 805337, nombre: 'Álgebra Lineal', siglas: 'AL', departamento: 'Otro', periodo: 2, plan_id: 1},
      {id: 803277, nombre: 'Fundamentos de Lenguajes Informaticos', siglas: 'FLI', departamento: 'SIC', periodo: 2, plan_id: 1},
      {id: 805347, nombre: 'Ingeniería del Software II', siglas: 'IS2', departamento: 'SIC', periodo: 2, plan_id: 1},
      {id: 803261, nombre: 'Fundamentos de la Electricidad y la Electrónica', siglas: 'FEE', departamento: 'Otro', periodo: 2, plan_id: 1},
      {id: 805345, nombre: 'Tecnología de la Programación II', siglas: 'TP2', departamento: 'SIC', periodo: 2, plan_id: 1},
      {id: 805343, nombre: 'Fundamentos de la Computación II', siglas: 'FC2', departamento: 'DACA', periodo: 2, plan_id: 1},
      {id: 805354, nombre: 'Inteligencia Artificial II', siglas: 'IA2', departamento: 'SIC', periodo: 2, plan_id: 1},
      {id: 803267, nombre: 'Estructura de los Computadores', siglas: 'EC', departamento: 'DACA', periodo: 2, plan_id: 1},
      {id: 805358, nombre: 'Estructuras de Datos', siglas: 'ED', departamento: 'SIC', periodo: 2, plan_id: 1},
      {id: 803278, nombre: 'Procesadores de Lenguajes', siglas: 'PL', departamento: 'SIC', periodo: 2, plan_id: 1},
      {id: 803368, nombre: 'Bases de Datos NoSQL', siglas: 'NSQ', departamento: 'SIC', periodo: 2, plan_id: 1}
    ]);
    
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
     return await queryInterface.bulkDelete('Asignatura', null, {});
  }
};
