const aws = require('aws-sdk');
aws.config.update({ region: "us-east-1" });
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