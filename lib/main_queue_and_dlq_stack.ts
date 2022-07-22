import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class MainQueueAndDLQStack extends Stack {
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

    // lambda that serves as a producer for main queue:
    const producerFunction = new lambda.Function(this, "producer-lambda", {
      code: lambda.Code.fromAsset('lambdas'),
      handler: 'producerLambda.handler',
      runtime: lambda.Runtime.NODEJS_16_X,
      environment: {
        QUEUE_URL: mainQueue.queueUrl,
      }
    })

    mainQueue.grantSendMessages(producerFunction);

    // consumer lambda that polls from the main queue
    const consumerLambda = new lambda.Function(this, "consumer-lambda", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambdas'),
      handler: 'consumerLambda.handler',
      events: [
        new SqsEventSource(mainQueue),
      ]
    }) 

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
    })

    topic.addSubscription(new subs.LambdaSubscription(writerFunction));
    topic.addSubscription(new subs.LambdaSubscription(slackFunction));

    topic.grantPublish(publisherFunction)
    table.grantReadWriteData(writerFunction)
  }
}