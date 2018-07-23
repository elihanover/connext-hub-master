import * as _ from "lodash";
import { Context, Callback } from "aws-lambda";
import { models } from "./models/index";
import {
  ContractEventAttributes,
  ContractEventInstance,
} from "./models/interfaces/contractevent-interface";
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

// vcStateUpdate from http request added to database
export async function vcStateUpdate(event, context, callback) {
    const update = JSON.parse(event.body)
    const vcUpdate: VCStateUpdateAttributes = {
      ts: Date.now(),
      eventType: "DidVCSettle",
      vcid: event.pathParameters.vcid,
      nonce: update.nonce,
      fields: JSON.stringify(update)
    };

    try {
      const e: VCStateUpdateInstance = await models.VCStateUpdate.create(
        vcUpdate
      );
    } catch(error) {
      console.log(error)
    }

    // What should this response actually be?
    const response = {
      statusCode: 200,
      headers: {
        "x-custom-header" : "My Header Value"
      },
      body: JSON.stringify(event.body)
    };

    callback(null, response);
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

  const contractAddress = "0xa6bc3e6b78684025428a530a1f14358daf2c7305"
  const contract = JSON.parse(fs.readFileSync('LedgerChannel.json', 'utf8'))
  const eventFinder = new web3.eth.Contract(contract.abi, contractAddress)

  // Query contract for DidVCSettle events between last block checked and now
  eventFinder.getPastEvents("DidVCSettle", {
    filter: {},
    fromBlock: blockNumber,
    toBlock: "latest"
  }, function(error, events){ console.log(events) })
  .then(async function(events){
    // Add each of these events to the ContractEvents database
    for (var i in events){
      const eventAttrs: ContractEventAttributes = {
        contract: contractAddress,
        ts: Date.now(),
        blockNumber: events[i].blockNumber,
        isValidBlock: true, // ¿¿ just assume true ??
        sender: "0x?", // ¿¿ who is sender and why keep track of sender ??
        eventType: "DidVCSettle",
        fields: JSON.stringify(events[i])
      };

      try {
        const e: ContractEventInstance = await models.ContractEvent.create(
          eventAttrs
        );
      } catch (error) {
        console.log(error)
      }
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

  // What should response be?
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "Created a DB entry.",
    })
  };
  callback(null, response);
}

// WILL BE TRIGGERED BY QUEUE
// flagEvents checks db for relevant events and makes dispute if higher nonced vcstateupdate
export async function flagEvents(event, context, callback) {
  // dependencies work as expected
  console.log(_.VERSION);

  // just for testing, will be passed params from queue
  var lastBlock = 0;

  // read blockchain db for events where:
  const foundEvents: ContractEventInstance[] = await models.ContractEvent.findAll({
    where: {
      blockNumber: {
        [op.gt]: lastBlock
      },
      eventType: {
        [op.or]: ["DidLCUpdateState", "DidVCSettle"]
      },
    }
  });

  // for each event found in eventDB, check for higher nonce state update
  for (var i = 0; i < foundEvents.length; i++) {
    var update = null
    try {
      update = JSON.parse(foundEvents[i].dataValues.fields).returnValues
    } catch { continue }

    if (update != null) {
      // query VCStateUpdate DB for higher nonce state update of this event type
      var proof: VCStateUpdateInstance = await models.VCStateUpdate.findOne({
        where: { // get max cosigned update with nonce > event.nonce
          vcid: {
            [op.eq]: foundEvents[i].dataValues.vcid
          },
          nonce: {
            [op.gt]: foundEvents[i].dataValues.nonce
          },
          eventType: {
            [op.eq]: foundEvents[i].dataValues.eventType
          }
        }
      })
      if (proof != null) {
        // submit proof
        const eventType = proof.dataValues.eventType
        proof = JSON.parse(proof.dataValues.fields)
        proof.eventType = eventType
        proof.lcid = update.lcid
        proof.balanceA = update.balanceA
        proof.balanceB = update.balanceB
        disputeWithProof(proof) // call contract at proof and construct proof and submit on chain
      } else {
        console.log("errr")
      }
    }
  }

  // what should this response be?
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: JSON.stringify(foundEvents),
      input: event
    })
  };

  callback(null, response);
}

// disputeWithProof challenges with higher nonce state update
async function disputeWithProof(proof) {
  const contractAddress = "0xa6bc3e6b78684025428a530a1f14358daf2c7305"
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
