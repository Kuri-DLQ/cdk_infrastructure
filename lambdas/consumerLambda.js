exports.handler = (event) => {
  for (const record of event.Records) {
    // console.log(record.messageAttributes)
    for (const attribute in record.messageAttributes) {
      console.log(record.messageAttributes[attribute].dataType)
      if (record.messageAttributes[attribute].dataType === 'String') {
        console.log(record.messageAttributes[attribute].stringValue);
      } else {
        throw "Message not processed";
      }
    }
  }
}