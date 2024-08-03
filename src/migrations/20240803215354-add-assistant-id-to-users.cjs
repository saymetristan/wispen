'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'assistant_ID', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'asst_AUZqqVPMNJFedXX3A5fYBp7f'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'assistant_ID');
  }
};