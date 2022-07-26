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
            timeout: aws_cdk_lib_1.Duration.seconds(30),
        });
        topic.addSubscription(new subs.LambdaSubscription(writerFunction));
        topic.addSubscription(new subs.LambdaSubscription(slackFunction));
        topic.grantPublish(publisherFunction);
        table.grantReadWriteData(writerFunction);
    }
}
exports.DlqOnlyStack = DlqOnlyStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGxxX29ubHlfc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkbHFfb25seV9zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBMEQ7QUFFMUQsMkNBQTJDO0FBQzNDLGlEQUFnRDtBQUNoRCxtREFBbUQ7QUFDbkQsMkNBQTBDO0FBQzFDLDBEQUF5RDtBQUN6RCxtRkFBc0U7QUFFdEUsTUFBYSxZQUFhLFNBQVEsbUJBQUs7SUFDckMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXZDLE1BQU0sZUFBZSxHQUF3QjtZQUMzQyxlQUFlLEVBQUUsQ0FBQztZQUNsQixLQUFLLEVBQUUsR0FBRztTQUNYLENBQUM7UUFFRixNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTNDLDRDQUE0QztRQUM1QyxNQUFNLGlCQUFpQixHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDdEUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO1lBQ3RDLE9BQU8sRUFBRSw0QkFBNEI7WUFDckMsT0FBTyxFQUFFLHNCQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUM3QixXQUFXLEVBQUU7Z0JBQ1gsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRO2FBQzlCO1lBQ0QsTUFBTSxFQUFFO2dCQUNOLElBQUkseUNBQWMsQ0FBQyxHQUFHLENBQUM7YUFDeEI7U0FDRixDQUFDLENBQUM7UUFFSCxNQUFNLEtBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNqRCxZQUFZLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLElBQUk7Z0JBQ1YsSUFBSSxFQUFFLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTTthQUNsQztTQUNGLENBQUMsQ0FBQztRQUVILDZDQUE2QztRQUM3QyxNQUFNLGNBQWMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLDZCQUE2QixFQUFFO1lBQzlFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztZQUN0QyxPQUFPLEVBQUUsNkJBQTZCO1lBQ3RDLE9BQU8sRUFBRSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDN0IsV0FBVyxFQUFFO2dCQUNYLFVBQVUsRUFBRSxLQUFLLENBQUMsU0FBUzthQUM1QjtTQUNGLENBQUMsQ0FBQztRQUVILHlDQUF5QztRQUN6QyxNQUFNLGFBQWEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLDRCQUE0QixFQUFFO1lBQzVFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDbkMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztZQUN0QyxPQUFPLEVBQUUsMkJBQTJCO1lBQ3BDLE9BQU8sRUFBRSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7U0FDOUIsQ0FBQyxDQUFBO1FBRUYsS0FBSyxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQ25FLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUVsRSxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUE7UUFDckMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFBO0lBQzFDLENBQUM7Q0FDRjtBQTNERCxvQ0EyREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdGFjaywgU3RhY2tQcm9wcywgRHVyYXRpb24gfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJ1xuaW1wb3J0ICogYXMgZHluYW1vIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucydcbmltcG9ydCAqIGFzIHN1YnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucy1zdWJzY3JpcHRpb25zJ1xuaW1wb3J0IHsgU3FzRXZlbnRTb3VyY2UgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLWV2ZW50LXNvdXJjZXMnO1xuXG5leHBvcnQgY2xhc3MgRGxxT25seVN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IERMUSA9IG5ldyBzcXMuUXVldWUodGhpcywgJ0RMUScpO1xuXG4gICAgY29uc3QgZGVhZExldHRlclF1ZXVlOiBzcXMuRGVhZExldHRlclF1ZXVlID0ge1xuICAgICAgbWF4UmVjZWl2ZUNvdW50OiAzLFxuICAgICAgcXVldWU6IERMUSxcbiAgICB9O1xuXG4gICAgY29uc3QgdG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsICd0b3BpYycpO1xuXG4gICAgLy8gcG9sbHMgZnJvbSBETFEgYW5kIHB1Ymxpc2hlcyB0byBTTlMgdG9waWNcbiAgICBjb25zdCBwdWJsaXNoZXJGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ3B1Ymxpc2hlci1sYW1iZGEnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTZfWCxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnbGFtYmRhcycpLFxuICAgICAgaGFuZGxlcjogJ3B1Ymxpc2hUb1NOU0xhbWJkYS5oYW5kbGVyJyxcbiAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgU05TX1RPUElDX0FSTjogdG9waWMudG9waWNBcm4sXG4gICAgICB9LFxuICAgICAgZXZlbnRzOiBbXG4gICAgICAgIG5ldyBTcXNFdmVudFNvdXJjZShETFEpLFxuICAgICAgXVxuICAgIH0pO1xuXG4gICAgY29uc3QgdGFibGUgPSBuZXcgZHluYW1vLlRhYmxlKHRoaXMsIFwidGVzdC10YWJsZVwiLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ2lkJyxcbiAgICAgICAgdHlwZTogZHluYW1vLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gc3Vic2NyaWJlcyB0byB0b3BpYyBhbmQgd3JpdGVzIHRvIGR5bmFtb2RiXG4gICAgY29uc3Qgd3JpdGVyRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdzdWJzY3JpYmVyLXRvLWR5bmFtby1sYW1iZGEnLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMTZfWCxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnbGFtYmRhcycpLFxuICAgICAgaGFuZGxlcjogJ3dyaXRlVG9EeW5hbW9MYW1iZGEuaGFuZGxlcicsXG4gICAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBzdWJzY3JpYmVzIHRvIHRvcGljIGFuZCBwb3N0cyB0byBTbGFja1xuICAgIGNvbnN0IHNsYWNrRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdzdWJzY3JpYmVyLXRvLXNsYWNrLWxhbWJkYScsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xNl9YLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsYW1iZGFzJyksXG4gICAgICBoYW5kbGVyOiAncG9zdFRvU2xhY2tMYW1iZGEuaGFuZGxlcicsXG4gICAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB9KVxuXG4gICAgdG9waWMuYWRkU3Vic2NyaXB0aW9uKG5ldyBzdWJzLkxhbWJkYVN1YnNjcmlwdGlvbih3cml0ZXJGdW5jdGlvbikpO1xuICAgIHRvcGljLmFkZFN1YnNjcmlwdGlvbihuZXcgc3Vicy5MYW1iZGFTdWJzY3JpcHRpb24oc2xhY2tGdW5jdGlvbikpO1xuXG4gICAgdG9waWMuZ3JhbnRQdWJsaXNoKHB1Ymxpc2hlckZ1bmN0aW9uKVxuICAgIHRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh3cml0ZXJGdW5jdGlvbilcbiAgfVxufSJdfQ==