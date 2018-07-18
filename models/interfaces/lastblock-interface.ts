import { Instance } from "sequelize";

export interface LastBlockAttributes {
  lastBlock: number;
}

export interface LastBlockInstance
  extends Instance<LastBlockAttributes> {
  dataValues: LastBlockAttributes;
}
