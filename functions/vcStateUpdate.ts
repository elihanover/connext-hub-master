console.log("1")
import { Context, Callback } from "aws-lambda";
console.log("2")
var AWS = require('aws-sdk')
console.log("3")
const docClient = new AWS.DynamoDB.DocumentClient({
    region: 'us-east-2',
    endpoint: 'https://dynamodb.us-east-2.amazonaws.com'
})

export async function vcStateUpdate(event, context, callback) {
  const update = JSON.parse(event.body)
  console.log(JSON.stringify(update))
  try {
    docClient.put({
      TableName: "vcStateUpdates",
      Item: {
        eventType: "DidVCSettle",
        vcid: event.pathParameters.vcid,
        nonce: update.nonce,
        balanceA: update.balanceA,
        balanceB: update.balanceB,
        sig: update.sig
      }
    }, function(err, data) {
      if (err) console.log(err, err.stack)
      else console.log("data: " + data)
    })

    callback(null, {
      statusCode: 200,
      headers: {
        "x-custom-header" : "My Header Value"
      },
      body: "VCSTATEUPDATE PUT WORKED"
    });
  } catch (error) {
    console.log("VCSTATEUPDATE ERROR")
    console.log(error)
  }
};
