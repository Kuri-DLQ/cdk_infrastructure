const https = require('https');
const util = require('util');

const POST_OPTIONS = {
  hostname: 'hooks.slack.com',
  path: '/services/T03PM1U0M32/B03NYJ6HH5H/C7Nmw9zGwg6DUXgKQfN4BNMs',
  method: 'POST',
};

const getDayMonthYear = (date) => {
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  return `${year}-` +
`${String(month).length === 1 ? '0' + month : month}-` +
`${String(day).length === 1 ? '0' + day : day} ` +
`${String(hours).length === 1 ? '0' + hours : hours}:` +
`${String(minutes).length === 1 ? '0' + minutes : minutes}:` +
`${String(seconds).length === 1 ? '0' + seconds : seconds}`
}

const reformatAttributes = (attributes) => {
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

  return attributes;
}

exports.handler = (event, context) => {
  for (const record of event.Records) {
    // record.Sns.MessageAttributes
    const message = {
      // text: 'A message has failed to be processed',
      // attachments: [{
      // color: '#8697db',
        blocks:[
          {
      			type: "section",
      			text: {
      			  type: 'mrkdwn',
      			  text: 'A message has failed to be processed'
      			}
      		},
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Main Queue:*\n${process.env.QUEUE_NAME}`
              },
              {
                type: 'mrkdwn',
                text: `*Dead Letter Queue:*\n${process.env.DLQ_NAME}`
              },
            ]
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: '*Timestamp:*\n' + getDayMonthYear(new Date(record.Sns.Timestamp))
              }
            ]
          },
       		{
      			type: "divider"
      		},
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Message Body:*\n${record.Sns.Message}`
              },
              {
                type: 'mrkdwn',
                text: '*Message Attributes:*\n' + JSON.stringify(reformatAttributes(record.Sns.MessageAttributes))
              }
            ]
          },
        ]
    // }];
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