const aws = require('aws-sdk');
aws.config.update({ region: "us-east-1" });
const sqs = new aws.SQS();

exports.handler = (event) => {
  for (const record of event.Records) {
    const params = {
      MessageBody: record.body,
      QueueUrl: process.env.QUEUE_URL,
      MessageAttributes: record.messageAttributes
    }

    const run = async () => {
      try {
        const data = await sqs.sendMessage(params).promise();
        console.log("Success -  message sent", data);
        return data;
      } catch (err) {
        console.log("Error", err);
      }
    };

    run();
  }
}