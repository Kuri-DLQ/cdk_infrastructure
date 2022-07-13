const aws = require('aws-sdk');
aws.config.update({ region: "us-east-1" });
const sqs = new aws.SQS();

exports.handler = (event) => {
  for (const record of event.Records) {
    const params = {
      MessageBody: record.body,
      QueueURL: process.env.QUEUE_URL,
    }

    // the run function uses .promise() instead of giving sendMessage a second callback argument
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

/*
{
  "Records": [
    {
      "messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
      "receiptHandle": "MessageReceiptHandle",
      "body": "Hello from SQS!",
      "attributes": {
        "ApproximateReceiveCount": "1",
        "SentTimestamp": "1523232000000",
        "SenderId": "123456789012",
        "ApproximateFirstReceiveTimestamp": "1523232000001"
      },
      "messageAttributes": {},
      "md5OfBody": "{{{md5_of_body}}}",
      "eventSource": "aws:sqs",
      "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:MyQueue",
      "awsRegion": "us-east-1"
    }
  ]
}
*/