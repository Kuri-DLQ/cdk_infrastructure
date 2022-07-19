const https = require('https');
const util = require('util');

const POST_OPTIONS = {
  hostname: 'hooks.slack.com',
  path: '/services/T035YKAM56K/B03NCKETY9F/kPqE1hPOj8piN6rxvu72ffLs',
  method: 'POST',
};

exports.handler = (event, context) => {
  for (const record of event.Records) {
    console.log(record);
    const message = {
      text: `A new message has arrived in "${process.env.DLQ_NAME}" dead letter queue 

assigned to "${process.env.QUEUE_NAME}" main queue

at ${record.Sns.Timestamp} with the following details:

Message Body: ${record.Sns.Message}
Message Attributes: ${JSON.stringify(record.Sns.MessageAttributes)}`
    };


    const req = https.request(POST_OPTIONS, res => {
      res.setEncoding('utf8');
      res.on('data', data => {
        context.succeed(`Message Sent: ${data}`);
      });
    }).on('error', e => {
      context.fail(`Failed: ${e}`);
    });
  
    req.write(util.format("%j", message));
    req.end();
  }
};