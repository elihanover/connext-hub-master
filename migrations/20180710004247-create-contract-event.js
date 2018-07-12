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
        type: Sequelize.STRING
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
  },

  // VCStateUpdate channel
  up2: (queryInterface, Sequelize) => {
    return queryInterface.createTable("Transactions", {
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
        type: Sequelize.STRING
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

  down2: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Transactions");
  },

  up3: (queryInterface, Sequelize) => {
    return queryInterface.createTable("LastBlock", {
      lastBlock: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      }
    });
  },

  down3: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("LastBlock");
  },
};
