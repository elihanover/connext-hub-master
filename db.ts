const Sequelize = require("sequelize");

export default async function() {
  const sequelize = new Sequelize({
    host: "localhost",
    database: "transactions",
    dialect: "postgres",
    username: "postgres",
    password: "connext"
  });

  await sequelize.authenticate();
  console.log("DB connected");
  return sequelize;
}

export function Event(sequelize: any) {
  return sequelize.import("./models/event.js");
}
