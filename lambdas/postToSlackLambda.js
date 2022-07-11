const https = require('https');
const util = require('util');

const POST_OPTIONS = {
  hostname: 'hooks.slack.com',
  path: '/services/T035YKAM56K/B03NCKETY9F/kPqE1hPOj8piN6rxvu72ffLs',
  method: 'POST',
};

exports.handler = (event, context) => {
  const message = {
    text: 'There is a message in the Dead-Letter Queue'
  };

  console.log('From SNS:', message);

  const req = https.request(POST_OPTIONS, res => {
    res.setEncoding('utf8');
    res.on('data', data => {
        context.succeed(`Message Sent: ${data}`);
    });
  }).on('error', e  => {
    context.fail(`Failed: ${e}`);
  });
  
  req.write(util.format("%j", message));
  req.end();
};