import * as _ from "lodash";
import { Context, Callback } from "aws-lambda";
import { models } from "./models/index";
import {
  VCStateUpdateAttributes,
  VCStateUpdateInstance,
} from "./models/interfaces/vcstateupdate-interface";
const Sequelize = require('sequelize');
const op = Sequelize.Op;
const fs = require('fs') // for reading contract abi
// web3 = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider("wss://rinkeby.infura.io/_ws")) // connect using websockets
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));


var AWS = require('aws-sdk')
const Consumer = require('sqs-consumer'); // for offline queue events

var myCredentials = new AWS.Credentials("x", "x");

var sqs = new AWS.SQS({
    apiVersion: '2012-11-05',
    credentials: myCredentials,
    region: "none",
    endpoint: "http://localhost:9324"
});

const app = Consumer.create({
  queueUrl: 'http://localhost:9324/queue/ContractEventQueue',
  handleMessage: (message, done) => {
    challengeEvent(message)
    done();
  },
  sqs: sqs
});

app.on('error', (err) => {
  console.log(err.message);
});

app.start();


// vcStateUpdate from http request added to database
export async function vcStateUpdate(event, context, callback) {
    const update = JSON.parse(event.body)
    const vcUpdate: VCStateUpdateAttributes = {
      eventType: "DidVCSettle",
      vcid: event.pathParameters.vcid,
      nonce: update.nonce,
      balanceA: update.balanceA,
      balanceB: update.balanceB,
      sig: update.sig
    };

    try {
      const e: VCStateUpdateInstance = await models.VCStateUpdate.create(
        vcUpdate
      );

      callback(null, {
        statusCode: 200,
        headers: {
          "x-custom-header" : "My Header Value"
        },
        body: JSON.stringify(e)
      });
    } catch(error) {
      console.log(error)
    }
};

// export async function cosignStateUpdate(event, context, callback) {
//   const msg = JSON.parse(event.body)
//
//   // update the vcstateupdate on channel c with nonce n
//   try {
//     const e: VCStateUpdateInstance = await models.VCStateUpdate.update(
//       {sigA: msg.sig},
//       {
//         where: {
//           nonce: {
//             [op.eq]: msg.nonce
//           },
//           sigA: {
//             [op.eq]: null
//           }
//         }
//       }
//     )
//   } catch (error) {
//     console.log(error)
//   }
//
//   // update the vcstateupdate on channel c with nonce n
//   try {
//     const e: VCStateUpdateInstance = await models.VCStateUpdate.update(
//       {sigB: msg.sig},
//       {
//         where: {
//           nonce: {
//             [op.eq]: msg.nonce
//           },
//           sigB: {
//             [op.eq]: null
//           }
//         }
//       }
//     )
//   } catch (error) {
//     console.log(error)
//   }
// }

// catchEvents gets hub contract events and stores them in ContractEvents DB
export async function catchEvents (event, context, callback) {
  var blockNumber = -1

  // get blockNumber of last polled block from LastBlock table
  try {
    blockNumber = await models.LastBlock.findOne({
      where: {
        lastBlock: {
          [op.ne]: null
        }
      }
    });
    blockNumber = blockNumber.dataValues.lastBlock
  } catch (error) {
    console.log(error)
  }

  const contractAddress = "0x339b8c36eb1eb942e88a1600c31269bb8561212c"
  const contract = JSON.parse(fs.readFileSync('LedgerChannel.json', 'utf8'))
  const eventFinder = new web3.eth.Contract(contract.abi, contractAddress)

  // Query contract for DidVCSettle events between last block checked and now
  eventFinder.getPastEvents("DidVCSettle", {
    filter: {},
    fromBlock: blockNumber,
    toBlock: "latest"
  }, function(error, events){ console.log(events) })
  .then(async function(events) {
    // Add each of these events to the ContractEvents database
    /// Add each of these events to ContractEvents Queue
    for (var i in events){
      // Format and send SQS message
      sqsMessageFrom(events[i])
    }
  })

  // update last block checked
  blockNumber = await web3.eth.getBlockNumber(function(err, res) {
    return res
  })

  // update LastBlock table to hold lastest polled block
  try {
    await models.LastBlock.update(
      {lastBlock: blockNumber},
      {
        where: {
          lastBlock: {
            [op.ne]: null
          }
        }
      }
    )
  } catch (error) {
    console.log(error)
  }
}

// challengeEvent receives an event from ContractEvents Queue,
// checks if a higher nonce state update exists for that virtual channel,
// and then makes a dispute on chain if one does exist
export async function challengeEvent(message, context, callback) {
  // console.log("event body: " + event.Body)
  const dispute = JSON.parse(message.Body)
  const eventFields = JSON.parse(dispute.fields.StringValue)

  console.log(JSON.stringify(eventFields, null, 4))
  console.log("vcid: " + eventFields.returnValues.vcId)
  console.log("updateSeq: " + eventFields.returnValues.updateSeq)
  console.log("event: " + eventFields.event)
  try {
    // (1) look into DB for higher nonce vcstateupdate
    var proof: VCStateUpdateInstance = await models.VCStateUpdate.findOne({
      where: { // get max cosigned update with nonce > event.nonce
        vcid: {
          [op.eq]: eventFields.returnValues.vcId
        },
        nonce: {
          [op.gt]: eventFields.returnValues.updateSeq
        },
        eventType: {
          [op.eq]: eventFields.event
        }
      }
    })

    // (2) if there is a proof, submit that
    if (proof) {
      // format and submit proof
      proof = proof.dataValues
      proof.lcid = eventFields.returnValues.lcId
      proof.partyA = eventFields.returnValues.partyA
      proof.partyB = eventFields.returnValues.partyB

      console.log("PROOF':" + JSON.stringify(proof, null, 4))
      disputeWithProof(proof)
    } else {
      console.log("NO PROOF")
    }
  } catch (error) {
    console.log(error)
  }
}

// disputeWithProof challenges with higher nonce state update
async function disputeWithProof(proof) {
  console.log("proof: " + proof)
  const contractAddress = "0x95adaa688252b8bb1af0860ac1e6af7774ef1385"
  const contract = JSON.parse(fs.readFileSync('LedgerChannel.json', 'utf8'));
  const ChannelManager = new web3.eth.Contract(contract.abi, contractAddress)

  if (proof.eventType == "DidVCSettle") {
    // get challenger's signature
    const balanceA = Web3.utils.toBN(proof.balanceA)
    const balanceB = Web3.utils.toBN(proof.balanceB)
    const hubBond = balanceA.add(balanceB)
    const hash = web3.utils.soliditySha3(
      { type: 'bytes32', value: proof.vcid },
      { type: 'uint256', value: proof.nonce },
      { type: 'address', value: proof.partyA },
      { type: 'address', value: proof.partyB },
      { type: 'uint256', value: hubBond },
      { type: 'uint256', value: proof.balanceA },
      { type: 'uint256', value: proof.balanceB }
    )
    web3.eth.sign(hash, proof.partyA, function(error, sigA) {
      ChannelManager.methods.settleVC(
        proof.lcid,
        proof.vcid,
        proof.nonce,
        proof.partyA,
        proof.partyB,
        proof.balanceA,
        proof.balanceB,
        sigA
      ).send(
        {from: "0x3ad3e0608f59d34cc4f7617d4f5e1abc6c196e50"}  // test address
      )
    })
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
     QueueUrl: "http://localhost:9324/queue/ContractEventQueue"
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
