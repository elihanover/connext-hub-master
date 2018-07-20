import { Instance } from "sequelize";

export interface VCStateUpdateAttributes {
  ts: number;
  eventType: string;
  vcid: string;
  nonce: number;
  fields: string;
}

export interface VCStateUpdateInstance
  extends Instance<VCStateUpdateAttributes> {
  dataValues: VCStateUpdateAttributes;
}
