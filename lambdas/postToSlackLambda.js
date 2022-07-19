const https = require('https');
const util = require('util');

const POST_OPTIONS = {
  hostname: 'hooks.slack.com',
  path: '/services/T035YKAM56K/B03NCKETY9F/kPqE1hPOj8piN6rxvu72ffLs',
  method: 'POST',
};

const getDayMonthYear = (date) => {
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

exports.handler = (event, context) => {
  for (const record of event.Records) {
    const message = {
      text: 'A message has failed to be processed',
      attachments: [{
        color: "#8697db",
        fields:[
          {
            title: 'Main queue name',
            value: `${process.env.QUEUE_NAME}`,
          },
          {
            title: 'Dead letter queue name',
            value: `${process.env.DLQ_NAME}`
          },
          {
            title: 'Timestamp',
            value: getDayMonthYear(new Date(record.Sns.Timestamp)),
          },
          {
            title: 'Message',
            value: `${record.Sns.Message}`,
          },
          {
            title: 'Message Attributes',
            value: JSON.stringify(record.Sns.MessageAttributes),
          }
        ]
      }]
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