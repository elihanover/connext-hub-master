const Sequelize = require("sequelize");

export default async function() {
  const sequelize = new Sequelize({
    host: "localhost", // TODO: change this to AWS postgres db
    database: "transactiondb",
    dialect: "postgres",
    username: "connext",
    password: "postgres"
  });

  await sequelize.authenticate();
  console.log("DB connected");
  return sequelize;
}

export function Event(sequelize: any) {
  return sequelize.import("./models/event.js");
}
