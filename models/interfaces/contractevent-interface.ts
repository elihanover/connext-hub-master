import { Instance } from "sequelize";

export interface ContractEventAttributes {
  contract: string;
  ts: number;
  blockNumber: number;
  isValidBlock: boolean;
  sender: string;
  eventType: string;
  fields: string;
}

export interface ContractEventInstance
  extends Instance<ContractEventAttributes> {
  dataValues: ContractEventAttributes;
}
