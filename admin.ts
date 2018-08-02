require('babel-register')({
    presets: [ 'env' ]
})

import { models } from './models/index';
const Sequelize = require('sequelize');
import { Context, Callback } from "aws-lambda";

export async function setLastBlock(event, context, callback) {
  console.log("Set lastblock: " + event.pathParameters.block)
  var lastBlock = -1
  try {
    const lastBlock = await models.LastBlock.create({
      lastBlock: event.pathParameters.block
    })

    // callback(null, {
    //   statusCode: 200,
    //   headers: {
    //     "x-custom-header" : "My Header Value"
    //   },
    //   body: "databased returned: " + JSON.stringify(lastBlock)
    // });

  } catch (error) {
    console.log("Didn't work :( " + error)

    callback(null, {
      statusCode: 200,
      headers: {
        "x-custom-header" : error
      },
      body: "Error: " + lastBlock
    });
  }


}
