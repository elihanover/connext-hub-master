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
} from "./models/interfaces/vcStateUpdate-interface";
const Sequelize = require('sequelize');
const op = Sequelize.Op;
const fs = require('fs') // for reading contract abi
// web3 = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider("wss://rinkeby.infura.io/_ws")) // connect using websockets
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

export async function vcStateUpdate(event, context, callback) {

    const update = JSON.parse(event.body)
    console.log(update.balanceA)

    const vcUpdate: VCStateUpdateAttributes = {
      ts: Date.now(),
      eventType: "DidVCSettle",
      vcid: update.vcid,
      lcid: update.lcid,
      nonce: update.nonce
      fields: JSON.stringify(update)
    };

    try {
      const e: VCStateUpdateInstance = await models.VCStateUpdate.create(
        vcUpdate
      );
      console.log("hello")
      console.log(e)
    } catch(error) {
      console.log(error)
    }

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

export async function catchEvents (
  event: any,
  context: Context,
  callback: Callback
) {
  var blockNumber = -1
  try {
    blockNumber = await models.LastBlock.findOne({
      where: {
        lastBlock: {
          [op.ne]: null
        }
      }
    });
    blockNumber = blockNumber.dataValues.lastBlock
    console.log("BNUMBER")
    console.log(blockNumber)
  } catch (error) {
    console.log(error)
  }

  // const contractAddress = "0x21245cef2107472dc0deeeb647f33ff460db6415" // rinkeby
  const contractAddress = "0x0b43adb4f175f9d8b95941fb725ab166f61b6894" // ganache
  const contract = JSON.parse(fs.readFileSync('LedgerChannel.json', 'utf8'))
  const eventFinder = new web3.eth.Contract(contract.abi, contractAddress)

  eventFinder.getPastEvents("DidVCSettle", {
    filter: {},
    fromBlock: blockNumber,
    toBlock: "latest"
  }, function(error, events){ console.log(events) })
  .then(async function(events){
    for (var i in events){
      const eventAttrs: ContractEventAttributes = {
        contract: "0x?",
        ts: Date.now(),
        blockNumber: events[i].blockNumber,
        isValidBlock: false,
        sender: "0x?",
        eventType: "DidVCSettle",
        fields: JSON.stringify(events[i])
      };

      try {
        const e: ContractEventInstance = await models.ContractEvent.create(
          eventAttrs
        );
        console.log("hello")
        console.log(e)
      }
      catch {
        console.log(error)
      }
    }
  })

  // update last block checked
  blockNumber = await web3.eth.getBlockNumber(function(err, res) {
    return res
  })

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
    console.log("hi")
    console.log(error)
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "Created a DB entry.",
    })
  };
  callback(null, response);
}

// testget grabs events from the database
export async function testget(event, context, callback) {
  // dependencies work as expected
  console.log(_.VERSION);

  // read db
  const foundEvent: ContractEventInstance = await models.ContractEvent.findOne({
    order: [["blockNumber", "DESC"]]
  });

  // async/await also works out of the box
  await new Promise((resolve, reject) => setTimeout(resolve, 500));

  var msg = -1
  if (foundEvent) {
    msg = foundEvent.dataValues.blockNumber
  }

  // return result
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: msg,
      input: event
    })
  };

  callback(null, response);
}

// check db for relevant events past block b
// and make dispute if higher nonce, cosigned vcstateupdate
export async function flagEvents(event, context, callback) {
  // dependencies work as expected
  console.log(_.VERSION);

  // just for testing, will be read from separate database
  var lastBlock = 0;

  // read blockchain db for events where:
  const foundEvents: ContractEventInstance[] = await models.ContractEvent.findAll({
    where: {
      blockNumber: {
        [op.gt]: lastBlock
      },
      eventType: {
        [op.or]: ["settleVC", "updateLCstate", "DidVCSettle"]
      },
    }
  });
  console.log(foundEvents[0].dataValues)

  // for each event found in eventDB, check for higher nonce state update
  for (var i = 0; i < foundEvents.length; i++) {
    var update = null
    try {
      update = JSON.parse(foundEvents[i].dataValues.fields)
      update = update.returnValues
    } catch { continue }

    if (update != null) {
      var proof: VCStateUpdateInstance = await models.VCStateUpdate.findOne({
        // get max cosigned update with nonce > event.nonce
        where: {
          vcid: {
            [op.eq]: update.vcId
          },
          nonce: {
            [op.gt]: update.updateSeq
          },
          eventType: {
            [op.eq]: foundEvents[i].dataValues.eventType
          }
        }
      })

      if (proof != null) {
        // make dispute
        const eventType = proof.dataValues.eventType
        proof = JSON.parse(proof.dataValues.fields)
        proof.eventType = eventType
        disputeWithProof(proof) // call contract at proof and construct proof and submit on chain
      } else {
        console.log("errr")
      }
    }

  }

  // return result
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: JSON.stringify(foundEvents),
      input: event
    })
  };

  callback(null, response);
}

// construct proof and submit on chain
async function disputeWithProof(proof) {
  console.log("testing :|")
  console.log(proof)

  const contractAddress = "0x0b43adb4f175f9d8b95941fb725ab166f61b6894"
  const contract = JSON.parse(fs.readFileSync('LedgerChannel.json', 'utf8'));
  const ChannelManager = new web3.eth.Contract(contract.abi, contractAddress)

  if (proof.eventType == "DidVCSettle") {
    // get challengers signature
    const hash = web3.utils.soliditySha3(
      { type: 'bytes32', value: proof.vcid },
      { type: 'uint256', value: proof.nonce },
      { type: 'address', value: proof.partyA },
      { type: 'address', value: proof.partyB },
      { type: 'uint256', value: proof.balanceA },
      { type: 'uint256', value: proof.balanceB }
    )
    console.log("testing :))")
    web3.eth.sign(hash, proof.partyA, function(error, sigA) {
      console.log("AAA")
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
        {from: "0x3ad3e0608f59d34cc4f7617d4f5e1abc6c196e50"}
      )
      console.log("BBB")
    }


  }
}
