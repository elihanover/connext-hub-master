# Connext Watcher Offline

Connext Watcher Offline is a completely offline implementation of the Connext Watcher using Serverless and ElasticMQ to simulate an AWS Simple Queue Service on your local machine.

## Requirements

* `elasticmq`
* `serverless` 
* `truffle`
* `ganache`

## Installing

npm dependencies

```
npm install
```

[Serverless](https://serverless.com/framework/docs/getting-started/)
```
npm install -g serverless
```

[Truffle](https://truffleframework.com/docs/getting_started/installation)
```
npm install -g truffle
```

[Ganache](https://github.com/trufflesuite/ganache-cli)
```
npm install -g ganache-cli
```

[ElasticMQ](https://github.com/adamw/elasticmq)

Download the ElasticMQ jar [here](https://s3/.../elasticmq-server-0.14.1.jar).

## Setting up the environment

First, let's get your local SQS up and running. 
```
java -jar /path/to/elasticmq-server-0.14.1.jar
```

Next, spin up a local blockchain using ganache-cli.
```
ganache-cli
```

Now, from different terminal window, go to the directory where your contracts live. Compile and migrate the LedgerChannel contract.
```
truffle compile
truffle migrate
```

This will automatically deploy the contract to your ganache local blockchain. Now add some events to the contract so that the lambdas will have something to work with.
```
truffle test
```

Back in the ganache-cli terminal window, you should see that a few transactions and contract addresses were added to your blockchain. 
```
Transaction: 0x9613d75fc92eff582f4d1d1b7c8b874fa2e8596ba00e39ffe85db61d9abd19fc
Contract created: 0x8a787c0f344efd0336252d7feac991946d2d39aa
Gas usage: 4008006
Block Number: 4
Block Time: Tue Jul 24 2018 11:19:12 GMT-0700 (Pacific Daylight Time)
```

Copy the most recent (highest block number) address following "Contract created:". Go to line 145 of connext-hub/handler.ts and replace the contract address with the one from your local blockchain
```
const contractAddress = "0xa6bc3e6b78684025428a530a1f14358daf2c7305" // ganache
```
This tells your lambda function the proper address to look at when trying to grab events from your local blockchain. Now that the local blockchain is set up and the contracts are deployed, migrate the databases so that the lambda functions have somewhere to store the data.
```
node_modules/.bin/sequelize db:migrate
```

## Running Serverless Offline

Finally, start Serverless offline to run the whole system. 
```
sls offline start
```
This will give you the routes to different lambda functions, which should look something like this:
```
Serverless: Routes for flagEvents:
Serverless: GET /flagEvents

Serverless: Routes for lambdaOne:
Serverless: GET /catchEvents

Serverless: Routes for vcStateUpdate:
Serverless: POST /virtualchannel/{vcid}/update

Serverless: Routes for cosignStateUpdate:
Serverless: POST /cosignStateUpdate

Serverless: Routes for chainsawPoll:
Serverless: POST /chainsaw/request

Serverless: Routes for testSQS:
Serverless: (none)

Serverless: Offline listening on http://localhost:3000
```

To trigger the whole process, call `http://localhost:3000/catchEvents`. <br />
To test individual functions, add the desired route to `http://localhost:3000`.















