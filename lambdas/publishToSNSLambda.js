const aws = require('aws-sdk');
require("dotenv").config();
aws.config.update({ region: process.env.REGION });
const sns = new aws.SNS();

exports.handler = (event) => {
  const formatAttributes = (attributes) => {
    console.log("attributes:", attributes)
    const result = {};
    for (const key in attributes) {
      result[key] = {
        "DataType": `${attributes[key]["dataType"]}`,
        "StringValue": `${attributes[key]["stringValue"]}`
      }
    }
    console.log("result:", result)
    return result;
  }


  for (const record of event.Records) {
    const params = {
      Message: record.body,
      MessageAttributes: formatAttributes(record.messageAttributes),
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