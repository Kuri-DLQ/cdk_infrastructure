exports.handler = (event) => {
  for (const record of event.Records) {
    for (const attribute in record.messageAttributes) {
      if (attribute.dataType === 'String') {
        console.log(attribute.dataValue);
      } else {
        throw "Message not processed";
      }
    }
  }
}