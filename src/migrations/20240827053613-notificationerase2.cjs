'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Elimina las tablas en el orden correcto (considerando las dependencias)
    await queryInterface.dropTable('Notifications');
    // Agrega más líneas para cada tabla que quieras eliminar
  },

  down: async (queryInterface, Sequelize) => {
    // Aquí puedes recrear las tablas si necesitas revertir esta migración
    // Este paso es opcional y depende de si quieres poder deshacer esta acción
  }
};