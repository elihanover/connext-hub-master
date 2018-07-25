/* tslint:disable:variable-name */

import * as SequelizeStatic from "sequelize";
import { DataTypes, Sequelize } from "sequelize";
import {
  ContractEventAttributes,
  ContractEventInstance
} from "./interfaces/contractevent-interface";

export default function(
  sequelize: Sequelize,
  dataTypes: DataTypes
): SequelizeStatic.Model<ContractEventInstance, ContractEventAttributes> {
  let ContractEvent = sequelize.define<
    ContractEventInstance,
    ContractEventAttributes
  >(
    "ContractEvent",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: dataTypes.INTEGER
      },
      contract: {
        type: dataTypes.STRING,
        allowNull: false
      },
      ts: {
        type: dataTypes.BIGINT,
        allowNull: false
      },
      blockNumber: {
        type: dataTypes.INTEGER,
        allowNull: false
      },
      isValidBlock: {
        type: dataTypes.BOOLEAN,
        allowNull: false
      },
      sender: {
        type: dataTypes.STRING,
        allowNull: false
      },
      eventType: {
        type: dataTypes.ENUM("DidVCSettle", "DidLCUpdateState"),
        allowNull: false
      },
      fields: {
        type: dataTypes.JSONB,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: dataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: dataTypes.DATE
      }
    },
    {
      indexes: [],
      classMethods: {},
      timestamps: true
    }
  );

  return ContractEvent;
}
