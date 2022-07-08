import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class ProjectPrototype1Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const DLQ = new sqs.Queue(this, 'DLQ');

    const deadLetterQueue: sqs.DeadLetterQueue = {
      maxReceiveCount: 3,
      queue: DLQ,
    };

    const mainQueue = new sqs.Queue(this, 'main-queue', {
      deadLetterQueue,
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
        new SqsEventSource(DLQ),
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

    topic.addSubscription(new subs.LambdaSubscription(writerFunction));
    
    topic.grantPublish(publisherFunction)
    table.grantReadWriteData(writerFunction)
  }
}