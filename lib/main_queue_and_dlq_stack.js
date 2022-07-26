"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainQueueAndDLQStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const sqs = require("aws-cdk-lib/aws-sqs");
const lambda = require("aws-cdk-lib/aws-lambda");
const dynamo = require("aws-cdk-lib/aws-dynamodb");
const sns = require("aws-cdk-lib/aws-sns");
const subs = require("aws-cdk-lib/aws-sns-subscriptions");
const aws_lambda_event_sources_1 = require("aws-cdk-lib/aws-lambda-event-sources");
class MainQueueAndDLQStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const DLQ = new sqs.Queue(this, 'DLQ');
        const deadLetterQueue = {
            maxReceiveCount: 3,
            queue: DLQ,
        };
        const mainQueue = new sqs.Queue(this, 'main-queue', {
            deadLetterQueue,
        });
        // lambda that serves as a producer for main queue:
        const producerFunction = new lambda.Function(this, "producer-lambda", {
            code: lambda.Code.fromAsset('lambdas'),
            handler: 'producerLambda.handler',
            runtime: lambda.Runtime.NODEJS_16_X,
            timeout: aws_cdk_lib_1.Duration.seconds(30),
            environment: {
                QUEUE_URL: mainQueue.queueUrl,
            }
        });
        mainQueue.grantSendMessages(producerFunction);
        // consumer lambda that polls from the main queue
        const consumerLambda = new lambda.Function(this, "consumer-lambda", {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambdas'),
            handler: 'consumerLambda.handler',
            timeout: aws_cdk_lib_1.Duration.seconds(30),
            events: [
                new aws_lambda_event_sources_1.SqsEventSource(mainQueue),
            ]
        });
        const topic = new sns.Topic(this, 'topic');
        // polls from DLQ and publishes to SNS topic
        const publisherFunction = new lambda.Function(this, 'publisher-lambda', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambdas'),
            handler: 'publishToSNSLambda.handler',
            timeout: aws_cdk_lib_1.Duration.seconds(30),
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
            timeout: aws_cdk_lib_1.Duration.seconds(30),
            environment: {
                TABLE_NAME: table.tableName,
            },
        });
        // subscribes to topic and posts to Slack
        const slackFunction = new lambda.Function(this, 'subscriber-to-slack-lambda', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambdas'),
            handler: 'postToSlackLambda.handler',
            environment: {
                QUEUE_URL: mainQueue.queueUrl,
                QUEUE_NAME: mainQueue.queueName,
                DLQ_URL: DLQ.queueUrl,
                DLQ_NAME: DLQ.queueName
            }
        });
        topic.addSubscription(new subs.LambdaSubscription(writerFunction));
        topic.addSubscription(new subs.LambdaSubscription(slackFunction));
        topic.grantPublish(publisherFunction);
        table.grantReadWriteData(writerFunction);
    }
}
exports.MainQueueAndDLQStack = MainQueueAndDLQStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbl9xdWV1ZV9hbmRfZGxxX3N0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbl9xdWV1ZV9hbmRfZGxxX3N0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQUEwRDtBQUUxRCwyQ0FBMkM7QUFDM0MsaURBQWdEO0FBQ2hELG1EQUFtRDtBQUNuRCwyQ0FBMEM7QUFDMUMsMERBQXlEO0FBQ3pELG1GQUFzRTtBQUV0RSxNQUFhLG9CQUFxQixTQUFRLG1CQUFLO0lBQzdDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBa0I7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV2QyxNQUFNLGVBQWUsR0FBd0I7WUFDM0MsZUFBZSxFQUFFLENBQUM7WUFDbEIsS0FBSyxFQUFFLEdBQUc7U0FDWCxDQUFDO1FBRUYsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDbEQsZUFBZTtTQUNoQixDQUFDLENBQUM7UUFFSCxtREFBbUQ7UUFDbkQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3BFLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7WUFDdEMsT0FBTyxFQUFFLHdCQUF3QjtZQUNqQyxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDN0IsV0FBVyxFQUFFO2dCQUNYLFNBQVMsRUFBRSxTQUFTLENBQUMsUUFBUTthQUM5QjtTQUNGLENBQUMsQ0FBQTtRQUVG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QyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtRQUNyQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUE7SUFDMUMsQ0FBQztDQUNGO0FBNUZELG9EQTRGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFN0YWNrLCBTdGFja1Byb3BzLCBEdXJhdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgc3FzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zcXMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnXG5pbXBvcnQgKiBhcyBkeW5hbW8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJ1xuaW1wb3J0ICogYXMgc3VicyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zLXN1YnNjcmlwdGlvbnMnXG5pbXBvcnQgeyBTcXNFdmVudFNvdXJjZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtZXZlbnQtc291cmNlcyc7XG5cbmV4cG9ydCBjbGFzcyBNYWluUXVldWVBbmRETFFTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBETFEgPSBuZXcgc3FzLlF1ZXVlKHRoaXMsICdETFEnKTtcblxuICAgIGNvbnN0IGRlYWRMZXR0ZXJRdWV1ZTogc3FzLkRlYWRMZXR0ZXJRdWV1ZSA9IHtcbiAgICAgIG1heFJlY2VpdmVDb3VudDogMyxcbiAgICAgIHF1ZXVlOiBETFEsXG4gICAgfTtcblxuICAgIGNvbnN0IG1haW5RdWV1ZSA9IG5ldyBzcXMuUXVldWUodGhpcywgJ21haW4tcXVldWUnLCB7XG4gICAgICBkZWFkTGV0dGVyUXVldWUsXG4gICAgfSk7XG5cbiAgICAvLyBsYW1iZGEgdGhhdCBzZXJ2ZXMgYXMgYSBwcm9kdWNlciBmb3IgbWFpbiBxdWV1ZTpcbiAgICBjb25zdCBwcm9kdWNlckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcInByb2R1Y2VyLWxhbWJkYVwiLCB7XG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYXMnKSxcbiAgICAgIGhhbmRsZXI6ICdwcm9kdWNlckxhbWJkYS5oYW5kbGVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBRVUVVRV9VUkw6IG1haW5RdWV1ZS5xdWV1ZVVybCxcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgbWFpblF1ZXVlLmdyYW50U2VuZE1lc3NhZ2VzKHByb2R1Y2VyRnVuY3Rpb24pO1xuXG4gICAgLy8gY29uc3VtZXIgbGFtYmRhIHRoYXQgcG9sbHMgZnJvbSB0aGUgbWFpbiBxdWV1ZVxuICAgIGNvbnN0IGNvbnN1bWVyTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcImNvbnN1bWVyLWxhbWJkYVwiLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTZfWCxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnbGFtYmRhcycpLFxuICAgICAgaGFuZGxlcjogJ2NvbnN1bWVyTGFtYmRhLmhhbmRsZXInLFxuICAgICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBldmVudHM6IFtcbiAgICAgICAgbmV3IFNxc0V2ZW50U291cmNlKG1haW5RdWV1ZSksXG4gICAgICBdXG4gICAgfSkgXG5cbiAgICBjb25zdCB0b3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ3RvcGljJyk7XG5cbiAgICAvLyBwb2xscyBmcm9tIERMUSBhbmQgcHVibGlzaGVzIHRvIFNOUyB0b3BpY1xuICAgIGNvbnN0IHB1Ymxpc2hlckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAncHVibGlzaGVyLWxhbWJkYScsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGFzJyksXG4gICAgICBoYW5kbGVyOiAncHVibGlzaFRvU05TTGFtYmRhLmhhbmRsZXInLFxuICAgICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBTTlNfVE9QSUNfQVJOOiB0b3BpYy50b3BpY0FybixcbiAgICAgIH0sXG4gICAgICBldmVudHM6IFtcbiAgICAgICAgbmV3IFNxc0V2ZW50U291cmNlKERMUSksXG4gICAgICBdXG4gICAgfSk7XG5cbiAgICBjb25zdCB0YWJsZSA9IG5ldyBkeW5hbW8uVGFibGUodGhpcywgXCJ0ZXN0LXRhYmxlXCIsIHtcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW8uQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBzdWJzY3JpYmVzIHRvIHRvcGljIGFuZCB3cml0ZXMgdG8gZHluYW1vZGJcbiAgICBjb25zdCB3cml0ZXJGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ3N1YnNjcmliZXItdG8tZHluYW1vLWxhbWJkYScsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGFzJyksXG4gICAgICBoYW5kbGVyOiAnd3JpdGVUb0R5bmFtb0xhbWJkYS5oYW5kbGVyJyxcbiAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogdGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIHN1YnNjcmliZXMgdG8gdG9waWMgYW5kIHBvc3RzIHRvIFNsYWNrXG4gICAgY29uc3Qgc2xhY2tGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ3N1YnNjcmliZXItdG8tc2xhY2stbGFtYmRhJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYXMnKSxcbiAgICAgIGhhbmRsZXI6ICdwb3N0VG9TbGFja0xhbWJkYS5oYW5kbGVyJyxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFFVRVVFX1VSTDogbWFpblF1ZXVlLnF1ZXVlVXJsLFxuICAgICAgICBRVUVVRV9OQU1FOiBtYWluUXVldWUucXVldWVOYW1lLFxuICAgICAgICBETFFfVVJMOiBETFEucXVldWVVcmwsXG4gICAgICAgIERMUV9OQU1FOiBETFEucXVldWVOYW1lXG4gICAgICB9XG4gICAgfSlcblxuICAgIHRvcGljLmFkZFN1YnNjcmlwdGlvbihuZXcgc3Vicy5MYW1iZGFTdWJzY3JpcHRpb24od3JpdGVyRnVuY3Rpb24pKTtcbiAgICB0b3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IHN1YnMuTGFtYmRhU3Vic2NyaXB0aW9uKHNsYWNrRnVuY3Rpb24pKTtcblxuICAgIHRvcGljLmdyYW50UHVibGlzaChwdWJsaXNoZXJGdW5jdGlvbilcbiAgICB0YWJsZS5ncmFudFJlYWRXcml0ZURhdGEod3JpdGVyRnVuY3Rpb24pXG4gIH1cbn0iXX0=