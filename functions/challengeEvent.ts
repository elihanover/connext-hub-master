console.log("1")
import { Context, Callback } from "aws-lambda";
console.log("2")
require('dotenv').config()
console.log("3")
const fs = require('fs') // for reading contract abi
console.log("4")
var Web3 = require('web3')
console.log("5")
var web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/a81caafee3aa481ea334e50bb1826326"))
console.log("6")
var AWS = require('aws-sdk')
console.log("7")
const docClient = new AWS.DynamoDB.DocumentClient({
    region: 'us-east-2',
    endpoint: 'https://dynamodb.us-east-2.amazonaws.com'
})

// challengeEvent receives an event from ContractEvents Queue,
// checks if a higher nonce state update exists for that virtual channel,
// and then makes a dispute on chain if one does exist
export async function challengeEvent(event, context, callback) {
  console.log("event: " + JSON.stringify(event))
  const dispute = JSON.parse(event.Records[0].body)
  const eventFields = JSON.parse(dispute.fields.StringValue)

  console.log(JSON.stringify(eventFields, null, 4))
  console.log("vcid: " + eventFields.returnValues.vcId)
  console.log("updateSeq: " + parseInt(eventFields.returnValues.updateSeq))
  console.log("event: " + eventFields.event)
  console.log(typeof eventFields.returnValues.vcId)
  console.log(typeof parseInt(eventFields.returnValues.updateSeq))
  console.log(typeof eventFields.event)
  try {
    // (1) look into DB for higher nonce vcstateupdate
    const proof = null
    await docClient.query({
      TableName: "vcStateUpdates",
      KeyConditionExpression: 'eventType = :et AND nonce > :n', // TODO: MAKE NONCE THE FILTER KEY and use vcID and eventType as KeyConditionExpression
      FilterExpression: 'vcid = :vc',
      ExpressionAttributeValues: {
        ':n': parseInt(eventFields.returnValues.updateSeq),
        ':vc': eventFields.returnValues.vcId,
        ':et': eventFields.event
      }
    }, function(err, proof) {
      if (err) console.log(err, err.stack)
      else {
        proof = proof.Items[0]
        console.log("proof: " + JSON.stringify(proof))
        // (2) if there is a proof, submit that
        if (proof) {
          // format and submit proof
          // proof = proof.dataValues
          proof.lcid = eventFields.returnValues.lcId
          proof.partyA = eventFields.returnValues.partyA
          proof.partyB = eventFields.returnValues.partyB

          console.log("PROOF':" + JSON.stringify(proof, null, 4))
          disputeWithProof(proof)
        } else {
          console.log("NO PROOF")
        }
      }
    }).promise()
  } catch (error) {
    console.log(error)
  }
}

// disputeWithProof challenges with higher nonce state update
async function disputeWithProof(proof) {
  console.log("proof: " + JSON.stringify(proof))
  const contractAddress = process.env.CONTRACT_ADDRESS
  const contract = JSON.parse(fs.readFileSync(__dirname + '/LedgerChannel.json', 'utf8')); // TODO: this is not in same directory, change path
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
        {from: process.env.SENDER_ADDRESS}  // test address
      )
    })
  }
}
