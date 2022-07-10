const aws = require('aws-sdk');
aws.config.update({ region: "us-east-1" });
const sns = new aws.SNS();

exports.handler = (event) => {
  for (const record of event.Records) {
    const params = {
      Message: record.body,
      TopicArn: process.env.SNS_TOPIC_ARN,
    }

    const run = async () => {
      try {
        const data = await sns.publish(params).promise();
        console.log("Success.",  data);
        return data;
      } catch (err) {
        console.log("Error", err.stack);
      }
    };
    
    run();
  }

  return;
}