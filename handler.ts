import * as _ from "lodash";
import { Context, Callback } from "aws-lambda";
import { models } from "./models/index";
import {
  ContractEventAttributes,
  ContractEventInstance
} from "./models/interfaces/contractevent-interface";
const Sequelize = require('sequelize');
const op = Sequelize.Op;
// Web3 = require('web3')
// web3 = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider("wss://rinkeby.infura.io/_ws")) // connect using websockets

// modern module syntax
export async function hello(event, context, callback) {
  // dependencies work as expected
  console.log(_.VERSION);

  // async/await also works out of the box
  await new Promise((resolve, reject) => setTimeout(resolve, 500));

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "Go Serverless v1.0! Your function executed successfully!",
      input: event
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
export async function flagEvents(event, context, callback) {
  // dependencies work as expected
  console.log(_.VERSION);

  // just for testing, will be read from separate database
  var lastBlock = 2;

  // read blockchain db for events where:
  const foundEvents: ContractEventInstance[] = await models.ContractEvent.findAll({
    where: {
      blockNumber: {
        [op.gt]: lastBlock
      },
      eventType: {
        [op.or]: ["settleVC", "updateLCstate"]
      },
    }
  });

  // for each event found in eventDB, check for cosigned higher nonce state update
  for (var i = 0; i < foundEvents.length; i++) {
    // // query txs database for highest nonced state update
    // const proof: VCStateUpdateInstance = await models.VCStateUpdate.findOne({
    //   // get max cosigned update with nonce > event.nonce
    //   where: {
    //     channelId: {
    //       [op.eq]: events[i].channelId
    //     },
    //     nonce: {
    //       [op.gt]: events[i].nonce
    //     },
    //     // cosigned
    //     fields: {
    //       sigA: {
    //         [op.ne]: null
    //       },
    //       sigB: {
    //         [op.ne]: null
    //       },
    //     },
    //   }
    //
    //   if (proof != null) {
    //     // make dispute
    //     disputeWithProof(proof) // call contract at proof and construct proof and submit on chain
    //   }
    // })
  }

  // submit the remaining to contract

  // async/await also works out of the box
  await new Promise((resolve, reject) => setTimeout(resolve, 500));


  // return result
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: JSON.stringify(sum),
      input: event
    })
  };

  callback(null, response);
}

// // construct proof and submit on chain
// async function disputeWithProof(proof) {
//   const contractAddress = "0x21245cef2107472dc0deeeb647f33ff460db6415" // rinkeby
//   contract = JSON.parse(fs.readFileSync('LedgerChannel.json', 'utf8'));
//   ChannelManager = new web3.eth.Contract(contract.abi, contractAddress)
//
//   if (proof.event == "settleVC") {
//     // get challengers signature
//     const hash = Web3.utils.soliditySha3(
//       { type: 'bytes32', value: proof.channelId },
//       { type: 'uint256', value: proof.nonce },
//       { type: 'address', value: proof.partyA },
//       { type: 'address', value: proof.partyB },
//       { type: 'uint256', value: proof.hubBond }, // ¿???????
//       { type: 'uint256', value: proof.balanceA },
//       { type: 'uint256', value: proof.balanceB }
//     )
//     sigA = await web3.eth.sign(hash, proof.partyA)
//
//     ChannelManager.settleVC(
//       // from contract
//       proof.lcID,
//       proof.vcID,
//       proof.updateSeq,
//       proof.partyA,
//       proof.partyB,
//       proof.updateBalA,
//       proof.updateBalB,
//       sigA
//     )
//   }
// }
