import { models } from "./models/index";
export async function setLastBlock(event, context, callback) {
  console.log("Set lastblock: " + event.pathParameters.block)
  try {
    const lastBlock = await models.LastBlock.create({
      lastBlock: event.pathParameters.block
    })
  } catch (error) {
    console.log("Didn't work :( " + error)
  }
}
