"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectPrototype1Stack = void 0;
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
        });
        topic.addSubscription(new subs.LambdaSubscription(writerFunction));
        topic.addSubscription(new subs.LambdaSubscription(slackFunction));
        topic.grantPublish(publisherFunction);
        table.grantReadWriteData(writerFunction);
    }
}
exports.DlqOnlyStack = DlqOnlyStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdF9wcm90b3R5cGVfMS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInByb2plY3RfcHJvdG90eXBlXzEtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkNBQWdEO0FBRWhELDJDQUEyQztBQUMzQyxpREFBZ0Q7QUFDaEQsbURBQW1EO0FBQ25ELDJDQUEwQztBQUMxQywwREFBeUQ7QUFDekQsbUZBQXNFO0FBRXRFLE1BQWEsc0JBQXVCLFNBQVEsbUJBQUs7SUFDL0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXZDLE1BQU0sZUFBZSxHQUF3QjtZQUMzQyxlQUFlLEVBQUUsQ0FBQztZQUNsQixLQUFLLEVBQUUsR0FBRztTQUNYLENBQUM7UUFFRixNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNsRCxlQUFlO1NBQ2hCLENBQUMsQ0FBQztRQUVILG1EQUFtRDtRQUNuRCxNQUFNLGdCQUFnQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDcEUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztZQUN0QyxPQUFPLEVBQUUsd0JBQXdCO1lBQ2pDLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsV0FBVyxFQUFFO2dCQUNYLFNBQVMsRUFBRSxTQUFTLENBQUMsUUFBUTthQUM5QjtTQUNGLENBQUMsQ0FBQTtRQUVGLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBRTlDLGlEQUFpRDtRQUNqRCxNQUFNLGNBQWMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ2xFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztZQUN0QyxPQUFPLEVBQUUsd0JBQXdCO1lBQ2pDLE1BQU0sRUFBRTtnQkFDTixJQUFJLHlDQUFjLENBQUMsU0FBUyxDQUFDO2FBQzlCO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsTUFBTSxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUUzQyw0Q0FBNEM7UUFDNUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQ3RFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztZQUN0QyxPQUFPLEVBQUUsNEJBQTRCO1lBQ3JDLFdBQVcsRUFBRTtnQkFDWCxhQUFhLEVBQUUsS0FBSyxDQUFDLFFBQVE7YUFDOUI7WUFDRCxNQUFNLEVBQUU7Z0JBQ04sSUFBSSx5Q0FBYyxDQUFDLEdBQUcsQ0FBQzthQUN4QjtTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ2pELFlBQVksRUFBRTtnQkFDWixJQUFJLEVBQUUsSUFBSTtnQkFDVixJQUFJLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ2xDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsNkNBQTZDO1FBQzdDLE1BQU0sY0FBYyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsNkJBQTZCLEVBQUU7WUFDOUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO1lBQ3RDLE9BQU8sRUFBRSw2QkFBNkI7WUFDdEMsV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxLQUFLLENBQUMsU0FBUzthQUM1QjtTQUNGLENBQUMsQ0FBQztRQUVILHlDQUF5QztRQUN6QyxNQUFNLGFBQWEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLDRCQUE0QixFQUFFO1lBQzVFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztZQUN0QyxPQUFPLEVBQUUsMkJBQTJCO1NBQ3JDLENBQUMsQ0FBQTtRQUVGLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUNuRSxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFFbEUsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO1FBQ3JDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsQ0FBQTtJQUMxQyxDQUFDO0NBQ0Y7QUFsRkQsd0RBa0ZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJ1xuaW1wb3J0ICogYXMgZHluYW1vIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucydcbmltcG9ydCAqIGFzIHN1YnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucy1zdWJzY3JpcHRpb25zJ1xuaW1wb3J0IHsgU3FzRXZlbnRTb3VyY2UgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLWV2ZW50LXNvdXJjZXMnO1xuXG5leHBvcnQgY2xhc3MgUHJvamVjdFByb3RvdHlwZTFTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBETFEgPSBuZXcgc3FzLlF1ZXVlKHRoaXMsICdETFEnKTtcblxuICAgIGNvbnN0IGRlYWRMZXR0ZXJRdWV1ZTogc3FzLkRlYWRMZXR0ZXJRdWV1ZSA9IHtcbiAgICAgIG1heFJlY2VpdmVDb3VudDogMyxcbiAgICAgIHF1ZXVlOiBETFEsXG4gICAgfTtcblxuICAgIGNvbnN0IG1haW5RdWV1ZSA9IG5ldyBzcXMuUXVldWUodGhpcywgJ21haW4tcXVldWUnLCB7XG4gICAgICBkZWFkTGV0dGVyUXVldWUsXG4gICAgfSk7XG5cbiAgICAvLyBsYW1iZGEgdGhhdCBzZXJ2ZXMgYXMgYSBwcm9kdWNlciBmb3IgbWFpbiBxdWV1ZTpcbiAgICBjb25zdCBwcm9kdWNlckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcInByb2R1Y2VyLWxhbWJkYVwiLCB7XG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYXMnKSxcbiAgICAgIGhhbmRsZXI6ICdwcm9kdWNlckxhbWJkYS5oYW5kbGVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgUVVFVUVfVVJMOiBtYWluUXVldWUucXVldWVVcmwsXG4gICAgICB9XG4gICAgfSlcblxuICAgIG1haW5RdWV1ZS5ncmFudFNlbmRNZXNzYWdlcyhwcm9kdWNlckZ1bmN0aW9uKTtcblxuICAgIC8vIGNvbnN1bWVyIGxhbWJkYSB0aGF0IHBvbGxzIGZyb20gdGhlIG1haW4gcXVldWVcbiAgICBjb25zdCBjb25zdW1lckxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgXCJjb25zdW1lci1sYW1iZGFcIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYXMnKSxcbiAgICAgIGhhbmRsZXI6ICdjb25zdW1lckxhbWJkYS5oYW5kbGVyJyxcbiAgICAgIGV2ZW50czogW1xuICAgICAgICBuZXcgU3FzRXZlbnRTb3VyY2UobWFpblF1ZXVlKSxcbiAgICAgIF1cbiAgICB9KSBcblxuICAgIGNvbnN0IHRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAndG9waWMnKTtcblxuICAgIC8vIHBvbGxzIGZyb20gRExRIGFuZCBwdWJsaXNoZXMgdG8gU05TIHRvcGljXG4gICAgY29uc3QgcHVibGlzaGVyRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdwdWJsaXNoZXItbGFtYmRhJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE2X1gsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xhbWJkYXMnKSxcbiAgICAgIGhhbmRsZXI6ICdwdWJsaXNoVG9TTlNMYW1iZGEuaGFuZGxlcicsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBTTlNfVE9QSUNfQVJOOiB0b3BpYy50b3BpY0FybixcbiAgICAgIH0sXG4gICAgICBldmVudHM6IFtcbiAgICAgICAgbmV3IFNxc0V2ZW50U291cmNlKERMUSksXG4gICAgICBdXG4gICAgfSk7XG5cbiAgICBjb25zdCB0YWJsZSA9IG5ldyBkeW5hbW8uVGFibGUodGhpcywgXCJ0ZXN0LXRhYmxlXCIsIHtcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW8uQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBzdWJzY3JpYmVzIHRvIHRvcGljIGFuZCB3cml0ZXMgdG8gZHluYW1vZGJcbiAgICBjb25zdCB3cml0ZXJGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ3N1YnNjcmliZXItdG8tZHluYW1vLWxhbWJkYScsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGFzJyksXG4gICAgICBoYW5kbGVyOiAnd3JpdGVUb0R5bmFtb0xhbWJkYS5oYW5kbGVyJyxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBzdWJzY3JpYmVzIHRvIHRvcGljIGFuZCBwb3N0cyB0byBTbGFja1xuICAgIGNvbnN0IHNsYWNrRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdzdWJzY3JpYmVyLXRvLXNsYWNrLWxhbWJkYScsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGFzJyksXG4gICAgICBoYW5kbGVyOiAncG9zdFRvU2xhY2tMYW1iZGEuaGFuZGxlcicsXG4gICAgfSlcblxuICAgIHRvcGljLmFkZFN1YnNjcmlwdGlvbihuZXcgc3Vicy5MYW1iZGFTdWJzY3JpcHRpb24od3JpdGVyRnVuY3Rpb24pKTtcbiAgICB0b3BpYy5hZGRTdWJzY3JpcHRpb24obmV3IHN1YnMuTGFtYmRhU3Vic2NyaXB0aW9uKHNsYWNrRnVuY3Rpb24pKTtcblxuICAgIHRvcGljLmdyYW50UHVibGlzaChwdWJsaXNoZXJGdW5jdGlvbilcbiAgICB0YWJsZS5ncmFudFJlYWRXcml0ZURhdGEod3JpdGVyRnVuY3Rpb24pXG4gIH1cbn0iXX0=