const contract = JSON.parse(fs.readFileSync('LedgerChannel.json', 'utf8'))
contractAddress = "0x339b8c36eb1eb942e88a1600c31269bb8561212c" // update this to addr of your contract
const ChannelManager = new web3.eth.Cotnract(contract.abi, contractAddress)

// Emits events that you can use in testing
ChannelManager.emitDidSettleVC(
      55, // lcid
      99, // vcid
      4, // updateSeq/nonce
      accounts[0], // partyA
      accounts[1], // partyB
      25, // updateBalA
      75, // updateBalB
      accounts[1] // challenger
)
