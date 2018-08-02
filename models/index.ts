import * as cls from "continuation-local-storage";
import * as fs from "fs";
import * as path from "path";
import * as SequelizeStatic from "sequelize";
import { Sequelize } from "sequelize";
import VCStateUpdate from "./vcstateupdate";
import LastBlock from "./lastblock";

class Database {
  private _basename: string;
  private _models: any;
  private _sequelize: Sequelize;

  constructor() {
    this._basename = path.basename(module.filename);
    let dbConfig = {
      username: "connext",
      password: "whydidiputmybabyinthoseballoons",
      database: "watcherdb",
      host: "watcherdb.cvrv85edefpy.us-east-2.rds.amazonaws.com",
      dialect: "postgres"
    };
    (SequelizeStatic as any).cls = cls.createNamespace("sequelize-transaction");
    this._sequelize = new SequelizeStatic(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      dbConfig
    );
    this._models = {} as any;
    console.log("__dirname: ", __dirname);
    fs.readdirSync(__dirname)
      .filter((file: string) => {
        console.log("file: ", file);
        return (
          file !== this._basename &&
          file !== "interfaces" &&
          file !== "index.js.map"
        );
      })
      .forEach((file: string) => {
        console.log("filtered file: ", file);
        let model = this._sequelize.import(path.join(__dirname, file));
        this._models[(model as any).name] = model;
      });

    Object.keys(this._models).forEach((modelName: string) => {
      if (typeof this._models[modelName].associate === "function") {
        this._models[modelName].associate(this._models);
      }
    });
  }

  getModels() {
    return this._models;
  }

  getSequelize() {
    return this._sequelize;
  }
}

const database = new Database();
export const models = database.getModels();
export const sequelize = database.getSequelize();
