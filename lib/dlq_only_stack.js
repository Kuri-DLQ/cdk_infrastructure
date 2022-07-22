"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DlqOnlyStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const sqs = require("aws-cdk-lib/aws-sqs");
const lambda = require("aws-cdk-lib/aws-lambda");
const dynamo = require("aws-cdk-lib/aws-dynamodb");
const sns = require("aws-cdk-lib/aws-sns");
const subs = require("aws-cdk-lib/aws-sns-subscriptions");
const aws_lambda_event_sources_1 = require("aws-cdk-lib/aws-lambda-event-sources");
class DlqOnlyStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const DLQ = new sqs.Queue(this, 'DLQ');
        const deadLetterQueue = {
            maxReceiveCount: 3,
            queue: DLQ,
        };
        const topic = new sns.Topic(this, 'topic');
        // polls from DLQ and publishes to SNS topic
        const publisherFunction = new lambda.Function(this, 'publisher-lambda', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambdas'),
            handler: 'publishToSNSLambda.handler',
            environment: {
                SNS_TOPIC_ARN: topic.topicArn,
            },
            events: [
                new aws_lambda_event_sources_1.SqsEventSource(DLQ),
            ]
        });
        const table = new dynamo.Table(this, "test-table", {
            partitionKey: {
                name: 'id',
                type: dynamo.AttributeType.STRING,
            }
        });
        // subscribes to topic and writes to dynamodb
        const writerFunction = new lambda.Function(this, 'subscriber-to-dynamo-lambda', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambdas'),
            handler: 'writeToDynamoLambda.handler',
            environment: {
                TABLE_NAME: table.tableName,
            },
        });
        // subscribes to topic and posts to Slack
        const slackFunction = new lambda.Function(this, 'subscriber-to-slack-lambda', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambdas'),
            handler: 'postToSlackLambda.handler',
        });
        topic.addSubscription(new subs.LambdaSubscription(writerFunction));
        topic.addSubscription(new subs.LambdaSubscription(slackFunction));
        topic.grantPublish(publisherFunction);
        table.grantReadWriteData(writerFunction);
    }
}
exports.DlqOnlyStack = DlqOnlyStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGxxX29ubHlfc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkbHFfb25seV9zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBZ0Q7QUFFaEQsMkNBQTJDO0FBQzNDLGlEQUFnRDtBQUNoRCxtREFBbUQ7QUFDbkQsMkNBQTBDO0FBQzFDLDBEQUF5RDtBQUN6RCxtRkFBc0U7QUFFdEUsTUFBYSxZQUFhLFNBQVEsbUJBQUs7SUFDckMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXZDLE1BQU0sZUFBZSxHQUF3QjtZQUMzQyxlQUFlLEVBQUUsQ0FBQztZQUNsQixLQUFLLEVBQUUsR0FBRztTQUNYLENBQUM7UUFFRixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTNDLDRDQUE0QztRQUM1QyxNQUFNLGlCQUFpQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDdEUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO1lBQ3RDLE9BQU8sRUFBRSw0QkFBNEI7WUFDckMsV0FBVyxFQUFFO2dCQUNYLGFBQWEsRUFBRSxLQUFLLENBQUMsUUFBUTthQUM5QjtZQUNELE1BQU0sRUFBRTtnQkFDTixJQUFJLHlDQUFjLENBQUMsR0FBRyxDQUFDO2FBQ3hCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxLQUFLLEdBQUcsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDakQsWUFBWSxFQUFFO2dCQUNaLElBQUksRUFBRSxJQUFJO2dCQUNWLElBQUksRUFBRSxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDbEM7U0FDRixDQUFDLENBQUM7UUFFSCw2Q0FBNkM7UUFDN0MsTUFBTSxjQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSw2QkFBNkIsRUFBRTtZQUM5RSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7WUFDdEMsT0FBTyxFQUFFLDZCQUE2QjtZQUN0QyxXQUFXLEVBQUU7Z0JBQ1gsVUFBVSxFQUFFLEtBQUssQ0FBQyxTQUFTO2FBQzVCO1NBQ0YsQ0FBQyxDQUFDO1FBRUgseUNBQXlDO1FBQ3pDLE1BQU0sYUFBYSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsNEJBQTRCLEVBQUU7WUFDNUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO1lBQ3RDLE9BQU8sRUFBRSwyQkFBMkI7U0FDckMsQ0FBQyxDQUFBO1FBRUYsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQ25FLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUVsRSxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUE7UUFDckMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFBO0lBQzFDLENBQUM7Q0FDRjtBQXhERCxvQ0F3REMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdGFjaywgU3RhY2tQcm9wcyB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgc3FzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zcXMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnXG5pbXBvcnQgKiBhcyBkeW5hbW8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJ1xuaW1wb3J0ICogYXMgc3VicyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zLXN1YnNjcmlwdGlvbnMnXG5pbXBvcnQgeyBTcXNFdmVudFNvdXJjZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtZXZlbnQtc291cmNlcyc7XG5cbmV4cG9ydCBjbGFzcyBEbHFPbmx5U3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgRExRID0gbmV3IHNxcy5RdWV1ZSh0aGlzLCAnRExRJyk7XG5cbiAgICBjb25zdCBkZWFkTGV0dGVyUXVldWU6IHNxcy5EZWFkTGV0dGVyUXVldWUgPSB7XG4gICAgICBtYXhSZWNlaXZlQ291bnQ6IDMsXG4gICAgICBxdWV1ZTogRExRLFxuICAgIH07XG5cbiAgICBjb25zdCB0b3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ3RvcGljJyk7XG5cbiAgICAvLyBwb2xscyBmcm9tIERMUSBhbmQgcHVibGlzaGVzIHRvIFNOUyB0b3BpY1xuICAgIGNvbnN0IHB1Ymxpc2hlckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAncHVibGlzaGVyLWxhbWJkYScsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGFzJyksXG4gICAgICBoYW5kbGVyOiAncHVibGlzaFRvU05TTGFtYmRhLmhhbmRsZXInLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgU05TX1RPUElDX0FSTjogdG9waWMudG9waWNBcm4sXG4gICAgICB9LFxuICAgICAgZXZlbnRzOiBbXG4gICAgICAgIG5ldyBTcXNFdmVudFNvdXJjZShETFEpLFxuICAgICAgXVxuICAgIH0pO1xuXG4gICAgY29uc3QgdGFibGUgPSBuZXcgZHluYW1vLlRhYmxlKHRoaXMsIFwidGVzdC10YWJsZVwiLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ2lkJyxcbiAgICAgICAgdHlwZTogZHluYW1vLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gc3Vic2NyaWJlcyB0byB0b3BpYyBhbmQgd3JpdGVzIHRvIGR5bmFtb2RiXG4gICAgY29uc3Qgd3JpdGVyRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdzdWJzY3JpYmVyLXRvLWR5bmFtby1sYW1iZGEnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTZfWCxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnbGFtYmRhcycpLFxuICAgICAgaGFuZGxlcjogJ3dyaXRlVG9EeW5hbW9MYW1iZGEuaGFuZGxlcicsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiB0YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gc3Vic2NyaWJlcyB0byB0b3BpYyBhbmQgcG9zdHMgdG8gU2xhY2tcbiAgICBjb25zdCBzbGFja0Z1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnc3Vic2NyaWJlci10by1zbGFjay1sYW1iZGEnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTZfWCxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnbGFtYmRhcycpLFxuICAgICAgaGFuZGxlcjogJ3Bvc3RUb1NsYWNrTGFtYmRhLmhhbmRsZXInLFxuICAgIH0pXG5cbiAgICB0b3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IHN1YnMuTGFtYmRhU3Vic2NyaXB0aW9uKHdyaXRlckZ1bmN0aW9uKSk7XG4gICAgdG9waWMuYWRkU3Vic2NyaXB0aW9uKG5ldyBzdWJzLkxhbWJkYVN1YnNjcmlwdGlvbihzbGFja0Z1bmN0aW9uKSk7XG5cbiAgICB0b3BpYy5ncmFudFB1Ymxpc2gocHVibGlzaGVyRnVuY3Rpb24pXG4gICAgdGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHdyaXRlckZ1bmN0aW9uKVxuICB9XG59Il19