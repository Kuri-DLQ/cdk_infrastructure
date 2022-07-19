const aws = require('aws-sdk');
// require('dotenv').config();
aws.config.update({ region: 'ca-central-1' });
const sns = new aws.SNS();

exports.handler = (event) => {
  const formatAttributes = (attributes) => {
    console.log("attributes:", attributes)
    const result = {};
    for (const key in attributes) {
      const append = attributes[key]['dataType'] === 'Number' ? '99999' : `--${attributes[key]['dataType']}`
      result[key] = {
        "DataType": `${attributes[key]["dataType"]}`,
        "StringValue": `${attributes[key]["stringValue"]}` + append
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

    console.log('RECORD', record)

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