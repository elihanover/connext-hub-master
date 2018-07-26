"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("ContractEvents", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      contract: {
        type: Sequelize.STRING
      },
      ts: {
        type: Sequelize.BIGINT
      },
      blockNumber: {
        type: Sequelize.INTEGER
      },
      isValidBlock: {
        type: Sequelize.BOOLEAN
      },
      sender: {
        type: Sequelize.STRING
      },
      eventType: {
        type: Sequelize.ENUM("DidVCSettle", "DidLCUpdateState")
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
    return queryInterface.dropTable("ContractEvents");
  }
};
