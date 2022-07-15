const aws = require('aws-sdk');
require("dotenv").config();
aws.config.update({ region: process.env.REGION });
const dynamodb = new aws.DynamoDB();

exports.handler = (event) => {
  for (const record of event.Records) {
    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        "id": { S: record.Sns.MessageId },
        "Message": { S: record.Sns.Message },
        "Attributes": { S: JSON.stringify(record.Sns.MessageAttributes) }
      }
    }
      
    const run = async () => {
      try {
        const data = await dynamodb.putItem(params).promise();
        console.log("Success - item added or updated", data);
        return data;
      } catch (err) {
        console.log("Error", err);
      }
    };

    run();
  }
}