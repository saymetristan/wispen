'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'Transactions'
          AND column_name = 'subcategory'
        ) THEN
          ALTER TABLE "Transactions" ADD COLUMN "subcategory" VARCHAR(255);
        END IF;
      END $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Transactions', 'subcategory');
  }
};