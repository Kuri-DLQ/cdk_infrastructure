import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';
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

    const table = new dynamo.Table(this, "test-table", {
      partitionKey: {
        name: 'id',
        type: dynamo.AttributeType.STRING,
      }
    });

    const lambdaFunction = new lambda.Function(this, 'lambda-function', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambdas'),
      handler: 'writeLambda.handler',
      environment: {
        TABLE_NAME: table.tableName,
      },
      events: [
        new SqsEventSource(DLQ),
      ]
    });

    table.grantReadWriteData(lambdaFunction)
  }
}