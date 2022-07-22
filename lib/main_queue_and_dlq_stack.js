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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbl9xdWV1ZV9hbmRfZGxxX3N0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFpbl9xdWV1ZV9hbmRfZGxxX3N0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQUFnRDtBQUVoRCwyQ0FBMkM7QUFDM0MsaURBQWdEO0FBQ2hELG1EQUFtRDtBQUNuRCwyQ0FBMEM7QUFDMUMsMERBQXlEO0FBQ3pELG1GQUFzRTtBQUV0RSxNQUFhLG9CQUFxQixTQUFRLG1CQUFLO0lBQzdDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBa0I7UUFDMUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV2QyxNQUFNLGVBQWUsR0FBd0I7WUFDM0MsZUFBZSxFQUFFLENBQUM7WUFDbEIsS0FBSyxFQUFFLEdBQUc7U0FDWCxDQUFDO1FBRUYsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDbEQsZUFBZTtTQUNoQixDQUFDLENBQUM7UUFFSCxtREFBbUQ7UUFDbkQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3BFLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7WUFDdEMsT0FBTyxFQUFFLHdCQUF3QjtZQUNqQyxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLFdBQVcsRUFBRTtnQkFDWCxTQUFTLEVBQUUsU0FBUyxDQUFDLFFBQVE7YUFDOUI7U0FDRixDQUFDLENBQUE7UUFFRixTQUFTLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUU5QyxpREFBaUQ7UUFDakQsTUFBTSxjQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUNsRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7WUFDdEMsT0FBTyxFQUFFLHdCQUF3QjtZQUNqQyxNQUFNLEVBQUU7Z0JBQ04sSUFBSSx5Q0FBYyxDQUFDLFNBQVMsQ0FBQzthQUM5QjtTQUNGLENBQUMsQ0FBQTtRQUVGLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFM0MsNENBQTRDO1FBQzVDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUN0RSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7WUFDdEMsT0FBTyxFQUFFLDRCQUE0QjtZQUNyQyxXQUFXLEVBQUU7Z0JBQ1gsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRO2FBQzlCO1lBQ0QsTUFBTSxFQUFFO2dCQUNOLElBQUkseUNBQWMsQ0FBQyxHQUFHLENBQUM7YUFDeEI7U0FDRixDQUFDLENBQUM7UUFFSCxNQUFNLEtBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNqRCxZQUFZLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLElBQUk7Z0JBQ1YsSUFBSSxFQUFFLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTTthQUNsQztTQUNGLENBQUMsQ0FBQztRQUVILDZDQUE2QztRQUM3QyxNQUFNLGNBQWMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLDZCQUE2QixFQUFFO1lBQzlFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztZQUN0QyxPQUFPLEVBQUUsNkJBQTZCO1lBQ3RDLFdBQVcsRUFBRTtnQkFDWCxVQUFVLEVBQUUsS0FBSyxDQUFDLFNBQVM7YUFDNUI7U0FDRixDQUFDLENBQUM7UUFFSCx5Q0FBeUM7UUFDekMsTUFBTSxhQUFhLEdBQUcsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSw0QkFBNEIsRUFBRTtZQUM1RSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7WUFDdEMsT0FBTyxFQUFFLDJCQUEyQjtZQUNwQyxXQUFXLEVBQUU7Z0JBQ1gsU0FBUyxFQUFFLFNBQVMsQ0FBQyxRQUFRO2dCQUM3QixVQUFVLEVBQUUsU0FBUyxDQUFDLFNBQVM7Z0JBQy9CLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUTtnQkFDckIsUUFBUSxFQUFFLEdBQUcsQ0FBQyxTQUFTO2FBQ3hCO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQ25FLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUVsRSxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUE7UUFDckMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFBO0lBQzFDLENBQUM7Q0FDRjtBQXhGRCxvREF3RkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdGFjaywgU3RhY2tQcm9wcyB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgc3FzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zcXMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnXG5pbXBvcnQgKiBhcyBkeW5hbW8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJ1xuaW1wb3J0ICogYXMgc3VicyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zLXN1YnNjcmlwdGlvbnMnXG5pbXBvcnQgeyBTcXNFdmVudFNvdXJjZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtZXZlbnQtc291cmNlcyc7XG5cbmV4cG9ydCBjbGFzcyBNYWluUXVldWVBbmRETFFTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBETFEgPSBuZXcgc3FzLlF1ZXVlKHRoaXMsICdETFEnKTtcblxuICAgIGNvbnN0IGRlYWRMZXR0ZXJRdWV1ZTogc3FzLkRlYWRMZXR0ZXJRdWV1ZSA9IHtcbiAgICAgIG1heFJlY2VpdmVDb3VudDogMyxcbiAgICAgIHF1ZXVlOiBETFEsXG4gICAgfTtcblxuICAgIGNvbnN0IG1haW5RdWV1ZSA9IG5ldyBzcXMuUXVldWUodGhpcywgJ21haW4tcXVldWUnLCB7XG4gICAgICBkZWFkTGV0dGVyUXVldWUsXG4gICAgfSk7XG5cbiAgICAvLyBsYW1iZGEgdGhhdCBzZXJ2ZXMgYXMgYSBwcm9kdWNlciBmb3IgbWFpbiBxdWV1ZTpcbiAgICBjb25zdCBwcm9kdWNlckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcInByb2R1Y2VyLWxhbWJkYVwiLCB7XG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYXMnKSxcbiAgICAgIGhhbmRsZXI6ICdwcm9kdWNlckxhbWJkYS5oYW5kbGVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgUVVFVUVfVVJMOiBtYWluUXVldWUucXVldWVVcmwsXG4gICAgICB9XG4gICAgfSlcblxuICAgIG1haW5RdWV1ZS5ncmFudFNlbmRNZXNzYWdlcyhwcm9kdWNlckZ1bmN0aW9uKTtcblxuICAgIC8vIGNvbnN1bWVyIGxhbWJkYSB0aGF0IHBvbGxzIGZyb20gdGhlIG1haW4gcXVldWVcbiAgICBjb25zdCBjb25zdW1lckxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJjb25zdW1lci1sYW1iZGFcIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYXMnKSxcbiAgICAgIGhhbmRsZXI6ICdjb25zdW1lckxhbWJkYS5oYW5kbGVyJyxcbiAgICAgIGV2ZW50czogW1xuICAgICAgICBuZXcgU3FzRXZlbnRTb3VyY2UobWFpblF1ZXVlKSxcbiAgICAgIF1cbiAgICB9KSBcblxuICAgIGNvbnN0IHRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAndG9waWMnKTtcblxuICAgIC8vIHBvbGxzIGZyb20gRExRIGFuZCBwdWJsaXNoZXMgdG8gU05TIHRvcGljXG4gICAgY29uc3QgcHVibGlzaGVyRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdwdWJsaXNoZXItbGFtYmRhJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYXMnKSxcbiAgICAgIGhhbmRsZXI6ICdwdWJsaXNoVG9TTlNMYW1iZGEuaGFuZGxlcicsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBTTlNfVE9QSUNfQVJOOiB0b3BpYy50b3BpY0FybixcbiAgICAgIH0sXG4gICAgICBldmVudHM6IFtcbiAgICAgICAgbmV3IFNxc0V2ZW50U291cmNlKERMUSksXG4gICAgICBdXG4gICAgfSk7XG5cbiAgICBjb25zdCB0YWJsZSA9IG5ldyBkeW5hbW8uVGFibGUodGhpcywgXCJ0ZXN0LXRhYmxlXCIsIHtcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW8uQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBzdWJzY3JpYmVzIHRvIHRvcGljIGFuZCB3cml0ZXMgdG8gZHluYW1vZGJcbiAgICBjb25zdCB3cml0ZXJGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ3N1YnNjcmliZXItdG8tZHluYW1vLWxhbWJkYScsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGFzJyksXG4gICAgICBoYW5kbGVyOiAnd3JpdGVUb0R5bmFtb0xhbWJkYS5oYW5kbGVyJyxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBzdWJzY3JpYmVzIHRvIHRvcGljIGFuZCBwb3N0cyB0byBTbGFja1xuICAgIGNvbnN0IHNsYWNrRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdzdWJzY3JpYmVyLXRvLXNsYWNrLWxhbWJkYScsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGFzJyksXG4gICAgICBoYW5kbGVyOiAncG9zdFRvU2xhY2tMYW1iZGEuaGFuZGxlcicsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBRVUVVRV9VUkw6IG1haW5RdWV1ZS5xdWV1ZVVybCxcbiAgICAgICAgUVVFVUVfTkFNRTogbWFpblF1ZXVlLnF1ZXVlTmFtZSxcbiAgICAgICAgRExRX1VSTDogRExRLnF1ZXVlVXJsLFxuICAgICAgICBETFFfTkFNRTogRExRLnF1ZXVlTmFtZVxuICAgICAgfVxuICAgIH0pXG5cbiAgICB0b3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IHN1YnMuTGFtYmRhU3Vic2NyaXB0aW9uKHdyaXRlckZ1bmN0aW9uKSk7XG4gICAgdG9waWMuYWRkU3Vic2NyaXB0aW9uKG5ldyBzdWJzLkxhbWJkYVN1YnNjcmlwdGlvbihzbGFja0Z1bmN0aW9uKSk7XG5cbiAgICB0b3BpYy5ncmFudFB1Ymxpc2gocHVibGlzaGVyRnVuY3Rpb24pXG4gICAgdGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHdyaXRlckZ1bmN0aW9uKVxuICB9XG59Il19