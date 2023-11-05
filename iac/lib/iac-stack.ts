import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Queue} from 'aws-cdk-lib/aws-sqs';
import { Duration } from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class IacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const mainQueue = new Queue(this,"main-queue",{
      queueName: "main-queue",
      visibilityTimeout: Duration.minutes(2),
      retentionPeriod: Duration.days(2),
    })

    const deadLeterQueue = new Queue(this,"main-queue-dlq",{
      queueName: "main-queue-dlq",
      retentionPeriod: Duration.days(2)
    })

    const lambda = new Function(this,"message-processer",{
      functionName: "message-processer",
      code: Code.fromAsset("../message-processer.zip"),
      handler: "src.index.handler",
      runtime: Runtime.PYTHON_3_11,
      deadLetterQueueEnabled: true,
      deadLetterQueue: deadLeterQueue
    })

    const queueEventSource = new SqsEventSource(mainQueue)
    lambda.addEventSource(queueEventSource)

  }
}
