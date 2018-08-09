const fs = require('fs')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/a81caafee3aa481ea334e50bb1826326"))
const contract = JSON.parse(fs.readFileSync('LedgerChannel.json', 'utf8'))
contractAddress = "0x07723d2DD73583C6BE0cB31b24692d7F6Dbd35e2" // update this to addr of your contract
const ChannelManager = new web3.eth.Contract(contract.abi, contractAddress)

eventFinder.getPastEvents("DidVCSettle", {
  filter: {},
  fromBlock: 2500000,
  toBlock: 'latest'
}, function(error, events){ console.log(events) })
.then(async function(events) {
  // Add each of these events to the ContractEvents database
  /// Add each of these events to ContractEvents Queue
  console.log("events: " + events)
  for (var i in events){
    console.log(event[i])
  }
  console.log("here")
})


// // Emits events that you can use in testing
// ChannelManager.emitDidSettleVC(
//       55, // lcid
//       99, // vcid
//       4, // updateSeq/nonce
//       accounts[0], // partyA
//       accounts[1], // partyB
//       25, // updateBalA
//       75, // updateBalB
//       accounts[1] // challenger
// )
