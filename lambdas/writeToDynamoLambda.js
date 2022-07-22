const aws = require('aws-sdk');
// require('dotenv').config();
aws.config.update({ region: 'us-east-1'})
const dynamodb = new aws.DynamoDB();

const handleAttributeType = (attributes) => {
  console.log('BEFORE LOOP in handleAttributeType', attributes)
  for (const key in attributes) {
    let stringValue = attributes[key]["Value"]
    if (stringValue.endsWith('99999')) {
      attributes[key]['Type'] = 'Number'
      attributes[key]["Value"] = stringValue.slice(0, -5)
    } else {
      let splitAttr = stringValue.split('--')
      const type = splitAttr[splitAttr.length - 1]
      splitAttr.pop()
      splitAttr = splitAttr.join('--')

      attributes[key]['Type'] = type
      attributes[key]["Value"] = splitAttr
    }
  }

  console.log('AFTER LOOP in handleAttributeType', attributes)
  return attributes
}


exports.handler = (event) => {
  for (const record of event.Records) {
    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        "id": { S: record.Sns.MessageId },
        "Message": { S: record.Sns.Message },
        "Attributes": { S: JSON.stringify(handleAttributeType(record.Sns.MessageAttributes)) }
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