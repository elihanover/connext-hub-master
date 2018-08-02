const { up, down } = require("serverless-pg-migrations/handlers");

// Undefined as of here...
console.log(up)
console.log(down)

module.exports.up = up;
module.exports.down = down;
