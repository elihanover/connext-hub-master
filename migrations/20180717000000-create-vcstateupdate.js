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
      eventType: {
        type: Sequelize.STRING
      },
      vcid: {
        type: Sequelize.STRING
      },
      nonce: {
        type: Sequelize.INTEGER
      },
      balanceA: {
          type: Sequelize.INTEGER
      },
      balanceB: {
          type: Sequelize.INTEGER
      },
      sig: {
        type: Sequelize.STRING
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
