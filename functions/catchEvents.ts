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
    endpoint: "https://sqs.us-east-2.amazonaws.com/849756307042/ContractEventQueue"
});
console.log("8")
const docClient = new AWS.DynamoDB.DocumentClient({
    region: 'us-east-2',
    endpoint: 'https://dynamodb.us-east-2.amazonaws.com'
})

// catchEvents gets hub contract events and stores them in ContractEvents DB
export async function catchEvents (event, context, callback) {
  var lastBlock = 0 // TODO: what do we want for production??

  try {
    console.log("BANG")
    docClient.query({
      TableName: "lastBlock",
      KeyConditionExpression: 'lastBlock gt :b', // TODO: expression error
      ExpressionAttributeValues: {
        ':b': 0
      }
    }, function(err, data) {
      if (err) console.log(err, err.stack)
      else {
        console.log(data)
        lastBlock = data
      }
    })

    console.log("BOOM")
  }
  catch (error) {
    console.log("READ ERROR")
    console.log(error)
  }

  console.log("LastBlock: " + lastBlock)

  // get most recent block
  var blockNumber = await web3.eth.getBlockNumber(function(err, res) {
    return res
  })
  console.log("Blocknumber: "+ blockNumber)

  const contractAddress = process.env.CONTRACT_ADDRESS
  console.log("Contract Address: " + contractAddress)
  const contract = JSON.parse(fs.readFileSync(__dirname + '/LedgerChannel.json', 'utf8'))
  // const contract = process.env.CONTRACT_JSON
  const eventFinder = new web3.eth.Contract(contract.abi, contractAddress)

  // Query contract for DidVCSettle events between last block checked and now
  eventFinder.getPastEvents("DidVCSettle", {
    filter: {},
    fromBlock: lastBlock,
    toBlock: blockNumber
  }, function(error, events){ console.log(events) })
  .then(async function(events) {
    // Add each of these events to the ContractEvents database
    /// Add each of these events to ContractEvents Queue
    for (var i in events){
      console.log(event[i])
      // Format and send SQS message
      sqsMessageFrom(events[i])
    }
  })
  console.log("Done with events.")

  // TODO: add the same functionality for lcstateupdate


  // update LastBlock table to hold lastest polled block
  // TODO: CHANGE TO UPDATE INSTEAD?
  try {
    docClient.put({
      TableName: "lastBlock",
      Item: {
        lastBlock: blockNumber
      }
    }, function(err, data) {
      if (err) {
        console.log("UPDATE LAST BLOCK ERROR")
        console.log(err, err.stack)
      }
      else {
        console.log("UPDATE LAST BLOCK WORKED")
        console.log(data)
      }
    })
  } catch (error) {
    console.log(error)
  }
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
