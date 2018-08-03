console.log("-1")
// import { models } from './models/index';
console.log("-2")
// const Sequelize = require('sequelize');
import { Context, Callback } from "aws-lambda";
var AWS = require('aws-sdk')

console.log("-3")

const docClient = new AWS.DynamoDB.DocumentClient({
    region: 'us-east-2',
    endpoint: 'https://dynamodb.us-east-2.amazonaws.com'
})
console.log("-4")
export async function setLastBlock(event, context, callback) {
  console.log("Set lastblock: " + event.pathParameters.block)
  try {
    console.log("BANG")
    docClient.put({
      TableName: "LastBlock",
      Item: {
        lastBlock: parseInt(event.pathParameters.block)
      }
    }, function(err, data) {
      if (err) console.log(err, err.stack)
      else console.log("data: " + data)
    })

    console.log("BOOM")
    callback(null, {
      statusCode: 200,
      headers: {
        "x-custom-header" : "My Header Value"
      },
      body: "GOTTTTTEEMMMM"
    });
  }
  catch (error) {
    console.log("EREROR")
    console.log(error)
    callback(null, {
      statusCode: 200,
      headers: {
        "x-custom-header" : "My Header Value"
      },
      body: "NAAAAH"
    });
  }
}
