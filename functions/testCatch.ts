const fs = require('fs')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/a81caafee3aa481ea334e50bb1826326"))

export async function handler(event, context, callback) {
  const contract = JSON.parse(fs.readFileSync(__dirname + '/LedgerChannel.json', 'utf8'))
  var contractAddress = "0x07723d2DD73583C6BE0cB31b24692d7F6Dbd35e2" // update this to addr of your contract
  const eventFinder = new web3.eth.Contract(contract.abi, contractAddress)

  var events = await eventFinder.getPastEvents("DidVCSettle", {
    filter: {},
    fromBlock: 2500000,
    toBlock: 'latest'
  }
  // , function(error, events){
  //   console.log(events)
  //   callback(null, {
  //     statusCode: 200,
  //     headers: {
  //       "x-custom-header" : "My Header Value"
  //     },
  //     body: "DONE"
  //   });
  // }
  )
  console.log(events)
  callback(null, {
    statusCode: 200,
    headers: {
      "x-custom-header" : "My Header Value"
    },
    body: "DONE"
  });

  // .then(async function(events) {
  //   // Add each of these events to the ContractEvents database
  //   /// Add each of these events to ContractEvents Queue
  //   console.log("events: " + events)
  //   for (var i in events){
  //   	console.log("1")
  //     console.log(events[i])
  //     console.log("2")
  //   }
  //   console.log("here")
  // })
}
