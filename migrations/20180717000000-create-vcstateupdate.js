"use strict";
module.exports = {
  // VCStateUpdate channel
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("VCStateUpdates", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ts: {
        type: Sequelize.BIGINT
      },
      eventType: {
        type: Sequelize.STRING
      },
      vcid: {
        type: Sequelize.STRING
      },
      lcid: {
        type: Sequelize.STRING
      },
      nonce: {
        type: Sequelize.INTEGER
      },
      fields: {
        type: Sequelize.JSONB
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("VCStateUpdates");
  }
}
