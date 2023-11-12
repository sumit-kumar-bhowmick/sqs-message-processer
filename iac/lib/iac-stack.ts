import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {Queue} from 'aws-cdk-lib/aws-sqs';
import { Duration } from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { StateMachineInput } from 'aws-cdk-lib/aws-codepipeline-actions';

export class IacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const DLQueue = new Queue(this,"main-queue-dlq",{
      queueName: "main-queue-dlq",
      retentionPeriod: Duration.days(2),
    })

    const mainQueue = new Queue(this,"main-queue",{
      queueName: "main-queue",
      visibilityTimeout: Duration.minutes(2),
      deadLetterQueue: {
        maxReceiveCount: 1,
        queue: DLQueue
      }
    })

    const lambda = new Function(this,"message-processer",{
      functionName: "message-processer",
      code: Code.fromAsset("../lambda.zip"),
      handler: "src.index.handler",
      runtime: Runtime.PYTHON_3_11
    })

    const destinationBucket = new Bucket(this,"destination-bucket",{
    bucketName: "my-destination-bucket-kljajfkla",
  })
  lambda.addEnvironment("DESTINATION_BUCKET_NAME", destinationBucket.bucketName)

  const queueEventSource = new SqsEventSource(mainQueue)
    lambda.addEventSource(queueEventSource)

  lambda.addToRolePolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "s3:PutObject"
      ],
      resources: [destinationBucket.bucketArn]
    })
  )
  }
}
