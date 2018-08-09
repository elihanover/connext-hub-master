console.log("1")
import { Context, Callback } from "aws-lambda";
console.log("2")
require('dotenv').config()
console.log("3")
const fs = require('fs') // for reading contract abi
console.log("4")
var AWS = require('aws-sdk')
console.log("5")
try {
  var Web3 = require('web3')
} catch(err) {
  console.log("err with web3")
  console.log(err, err.stack)
}
console.log("6")
var web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/a81caafee3aa481ea334e50bb1826326"))
console.log("7")
var sqs = new AWS.SQS({
    // apiVersion: '2012-11-05',
    // credentials: myCredentials,
    // region: "none",
    // endpoint: process.env.SQS_ENDPOINT
    endpoint: process.env.SQS_URL
});
console.log("8")
const docClient = new AWS.DynamoDB.DocumentClient({
    region: 'us-east-2',
    endpoint: 'https://dynamodb.us-east-2.amazonaws.com'
})

// catchEvents gets hub contract events and stores them in ContractEvents DB
export async function catchEvents (event, context, callback) {
  console.log("BANG")
  var data = await docClient.query({
    TableName: "lastBlock",
    KeyConditionExpression: 'test = :t AND lastBlock > :b', // TODO: expression error
    ExpressionAttributeValues: {
      ':t': 'test',
      ':b': 0
    }
  }).promise()

  var lastBlock = data.Items[data.Count - 1].lastBlock

  // get most recent block
  var blockNumber = await web3.eth.getBlockNumber(function(err, res) {
    return res
  })

  // TODO: FOR TESTING
  lastBlock = 2500000

  const contractAddress = process.env.CONTRACT_ADDRESS
  console.log("Contract Address: " + contractAddress)
  const contract = JSON.parse(fs.readFileSync(__dirname + '/LedgerChannel.json', 'utf8'))
  // const contract = process.env.CONTRACT_JSON
  const eventFinder = new web3.eth.Contract(contract.abi, contractAddress)

  console.log(eventFinder)
  // Query contract for DidVCSettle events between last block checked and now
  console.log("LastBlock: " + lastBlock)
  console.log("Blocknumber: " + blockNumber)
  var events = await eventFinder.getPastEvents("DidVCSettle", {
    filter: {},
    fromBlock: lastBlock,
    toBlock: blockNumber
  })

  // Add each of these events to the ContractEvents queue
  for (var i in events){
    console.log(events[i])
    // Format and send SQS message
    sqsMessageFrom(events[i])
  }

  // TODO: add the same functionality for lcstateupdate


  // update LastBlock table to hold lastest polled block
  // TODO: CHANGE TO UPDATE INSTEAD
  try {
    docClient.put({
      TableName: "lastBlock",
      Item: {
        test: 'test',
        lastBlock: blockNumber
      }
    }, function(err, data) {
      if (err) {
        console.log("Write Error")
        console.log(err, err.stack)
      }
      else {
        console.log("Write Success")
        console.log(data)
      }
    })
  } catch (error) {
    console.log(error)
  }

  callback(null, {
    statusCode: 200,
    headers: {
      "x-custom-header" : "My Header Value"
    },
    body: "DONE"
  });
}

// createSQSMessageFrom constructs an SQS message from a blockchain event
async function sqsMessageFrom(event) {
  const attributes = JSON.stringify({
    "ts": {
      DataType: "String",
      StringValue: String(Date.now())
    },
    "blockNumber": {
      DataType: "String",
      StringValue: String(event.blockNumber)
    },
    "isValidBlock": {
      DataType: "Binary",
      BinaryValue: "true"
    },
    "sender": {
      DataType: "String",
      StringValue: String(event.address)
    },
    "eventType": {
      DataType: "String",
      StringValue: String(event.event)
    },
    "fields": {
      DataType:  "String",
      StringValue: JSON.stringify(event)
    }
  })

  const params = {
     DelaySeconds: 5,
     MessageAttributes: null,
     MessageBody: attributes,
     QueueUrl: process.env.SQS_URL
  };

  // Send message to SQS ContractEvent queue
  sqs.sendMessage(params, function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.MessageId);
    }
  })
}
