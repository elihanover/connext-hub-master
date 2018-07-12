import { Context, Callback } from "aws-lambda";
import { models } from "../../models/index";
import {
  ContractEventAttributes,
  ContractEventInstance
} from "../../models/interfaces/contractevent-interface";

export async function handler(
  event: any,
  context: Context,
  callback: Callback
) {
  let blockNumber = 1;
  const foundEvent: ContractEventInstance = await models.ContractEvent.findOne({
    order: [["blockNumber", "DESC"]]
  });

  if (foundEvent) {
    blockNumber = foundEvent.dataValues.blockNumber + 1;
  }

  const eventAttrs: ContractEventAttributes = {
    blockNumber,
    contract: "0x0",
    eventType: "NEW_EVENT",
    fields: JSON.stringify({ hello: "world" }),
    isValidBlock: true,
    sender: "0x0",
    ts: Date.now()
  };
  const e: ContractEventInstance = await models.ContractEvent.create(
    eventAttrs
  );

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "Created a DB entry.",
      entry: e
    })
  };
  callback(null, response);
}
